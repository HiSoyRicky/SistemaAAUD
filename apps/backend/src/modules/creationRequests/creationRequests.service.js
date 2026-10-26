import {
  getResolvedUserPermissionCodes,
  hasPermissionCode,
} from '../../common/rbac/permissions.service.js';
import AppError from '../../common/utils/AppError.js';
import { prisma } from '../../config/prisma.js';
import { create as createBrand } from '../brands/brands.service.js';
import { create as createDevice } from '../devices/devices.service.js';
import { create as createInventory } from '../inventory/inventory.service.js';
import { createInventoryBodySchema } from '../inventory/inventory.validator.js';
import { create as createModel } from '../models/models.service.js';

const requestInclude = {
  requester: { select: { id: true, nombre_completo: true, username: true } },
  reviewer: { select: { id: true, nombre_completo: true, username: true } },
};
const permissionByType = {
  INVENTORY: 'inventory.create',
  BRAND: 'brands.create',
  MODEL: 'models.create',
  DEVICE: 'devices.create',
};
const readPermissionByType = {
  INVENTORY: 'inventory.read',
  BRAND: 'brands.read',
  MODEL: 'models.read',
  DEVICE: 'devices.read',
};
const typeLabels = {
  INVENTORY: 'activo',
  BRAND: 'marca',
  MODEL: 'modelo',
  DEVICE: 'tipo de activo',
};

function parsePayload(type, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError('La solicitud debe incluir datos válidos.', 400);
  }
  const serialized = JSON.stringify(payload);
  if (serialized.length > 30000)
    throw new AppError('La solicitud excede el tamaño permitido.', 413);

  if (type === 'INVENTORY') {
    const parsed = createInventoryBodySchema.safeParse(payload);
    if (!parsed.success)
      throw new AppError(parsed.error.issues[0]?.message || 'Datos del activo inválidos.', 400);
    return parsed.data;
  }
  const name = String(payload.name || '').trim();
  if (!name || name.length > 120)
    throw new AppError('Indique un nombre válido de hasta 120 caracteres.', 400);
  if (type === 'BRAND' || type === 'DEVICE') return { name };
  if (type === 'MODEL') {
    const idBrand = Number(payload.id_brand);
    const idDevice =
      payload.id_device == null || payload.id_device === '' ? null : Number(payload.id_device);
    if (
      !Number.isInteger(idBrand) ||
      idBrand < 1 ||
      (idDevice !== null && (!Number.isInteger(idDevice) || idDevice < 1))
    ) {
      throw new AppError('La marca o el tipo de modelo no son válidos.', 400);
    }
    return { name, id_brand: idBrand, id_device: idDevice };
  }
  throw new AppError('Tipo de solicitud no válido.', 400);
}

export const create = async ({ type: rawType, payload: rawPayload }, user) => {
  const type = String(rawType || '')
    .trim()
    .toUpperCase();
  if (!Object.hasOwn(permissionByType, type))
    throw new AppError('Tipo de solicitud no válido.', 400);
  const payload = parsePayload(type, rawPayload);
  const grantedCodes = await getResolvedUserPermissionCodes(user);
  if (!hasPermissionCode({ grantedCodes, requiredCode: readPermissionByType[type] })) {
    throw new AppError(
      `No tienes acceso para solicitar ${typeLabels[type]}.`,
      403,
      'MISSING_PERMISSION'
    );
  }
  if (hasPermissionCode({ grantedCodes, requiredCode: permissionByType[type] })) {
    throw new AppError(
      `Ya tienes permiso para crear ${typeLabels[type]}; usa el formulario habitual.`,
      409
    );
  }

  const requesterId = Number(user?.id);
  const pendingCount = await prisma.creation_requests.count({
    where: { requester_id: requesterId, status: { in: ['PENDING', 'PROCESSING'] } },
  });
  if (pendingCount >= 10)
    throw new AppError(
      'Tienes 10 solicitudes pendientes. Espera la revisión del administrador.',
      429
    );

  const pending = await prisma.creation_requests.findMany({
    where: { requester_id: requesterId, type, status: 'PENDING' },
    select: { payload: true },
  });
  if (pending.some((entry) => JSON.stringify(entry.payload) === JSON.stringify(payload))) {
    throw new AppError('Ya enviaste esta misma solicitud y está pendiente de revisión.', 409);
  }

  return prisma.creation_requests.create({
    data: { type, payload, requester_id: requesterId },
    include: requestInclude,
  });
};

function idsFor(requests, key) {
  return [
    ...new Set(
      requests
        .map(({ payload }) => Number(payload?.[key]))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
}

function asMap(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

async function addDisplayData(requests) {
  if (!requests.length) return requests;
  const ids = {
    brands: idsFor(requests, 'id_brand'),
    devices: idsFor(requests, 'id_device'),
    models: idsFor(requests, 'id_model'),
    ubications: idsFor(requests, 'id_ubication'),
    departments: idsFor(requests, 'id_department'),
    statuses: idsFor(requests, 'id_status'),
    conditions: idsFor(requests, 'id_condition'),
    assetTypes: idsFor(requests, 'asset_type_id'),
    extensions: idsFor(requests, 'extension_id'),
    areas: idsFor(requests, 'id_administrative_area'),
    rules: idsFor(requests, 'classification_rule_id'),
    vehicleCatalog: idsFor(requests, 'vehicle_catalog_id'),
  };
  const [
    brands,
    devices,
    models,
    ubications,
    departments,
    statuses,
    conditions,
    assetTypes,
    extensions,
    areas,
    rules,
    vehicleCatalog,
  ] = await Promise.all([
    ids.brands.length
      ? prisma.brands.findMany({
          where: { id: { in: ids.brands } },
          select: { id: true, name: true },
        })
      : [],
    ids.devices.length
      ? prisma.devices.findMany({
          where: { id: { in: ids.devices } },
          select: { id: true, name: true },
        })
      : [],
    ids.models.length
      ? prisma.models.findMany({
          where: { id: { in: ids.models } },
          include: { brands: { select: { name: true } }, devices: { select: { name: true } } },
        })
      : [],
    ids.ubications.length
      ? prisma.ubications.findMany({
          where: { id: { in: ids.ubications } },
          select: { id: true, name: true },
        })
      : [],
    ids.departments.length
      ? prisma.departments.findMany({
          where: { id: { in: ids.departments } },
          select: { id: true, name: true },
        })
      : [],
    ids.statuses.length
      ? prisma.status.findMany({
          where: { id: { in: ids.statuses } },
          select: { id: true, name: true },
        })
      : [],
    ids.conditions.length
      ? prisma.inventory_conditions.findMany({
          where: { id: { in: ids.conditions } },
          select: { id: true, name: true },
        })
      : [],
    ids.assetTypes.length
      ? prisma.inventory_asset_types.findMany({
          where: { id: { in: ids.assetTypes } },
          select: { id: true, name: true },
        })
      : [],
    ids.extensions.length
      ? prisma.inventory_asset_extensions.findMany({
          where: { id: { in: ids.extensions } },
          select: { id: true, name: true },
        })
      : [],
    ids.areas.length
      ? prisma.inventory_administrative_areas.findMany({
          where: { id: { in: ids.areas } },
          select: { id: true, name: true },
        })
      : [],
    ids.rules.length
      ? prisma.inventory_asset_classification_rules.findMany({
          where: { id: { in: ids.rules } },
          include: {
            classification: { select: { description: true, code_new: true } },
            asset_type: { select: { name: true } },
            extension: { select: { name: true } },
            administrative_area: { select: { name: true } },
            device: { select: { name: true } },
          },
        })
      : [],
    ids.vehicleCatalog.length
      ? prisma.inventory_vehicle_catalog.findMany({
          where: { id: { in: ids.vehicleCatalog } },
          include: { brand: { select: { name: true } }, model: { select: { name: true } } },
        })
      : [],
  ]);
  const maps = {
    brands: asMap(brands),
    devices: asMap(devices),
    models: asMap(models),
    ubications: asMap(ubications),
    departments: asMap(departments),
    statuses: asMap(statuses),
    conditions: asMap(conditions),
    assetTypes: asMap(assetTypes),
    extensions: asMap(extensions),
    areas: asMap(areas),
    rules: asMap(rules),
    vehicleCatalog: asMap(vehicleCatalog),
  };
  const labels = [
    ['tag', 'Marbete'],
    ['description', 'Descripción'],
    ['id_ubication', 'Ubicación', 'ubications'],
    ['id_department', 'Departamento', 'departments'],
    ['user', 'Usuario asignado'],
    ['id_status', 'Estado', 'statuses'],
    ['id_condition', 'Condición', 'conditions'],
    ['asset_type_id', 'Tipo de bien', 'assetTypes'],
    ['extension_id', 'Extensión', 'extensions'],
    ['id_administrative_area', 'Área administrativa', 'areas'],
    ['classification_rule_id', 'Clasificación patrimonial', 'rules'],
    ['id_device', 'Tipo de activo', 'devices'],
    ['id_brand', 'Marca', 'brands'],
    ['id_model', 'Modelo', 'models'],
    ['serie', 'Serie'],
    ['ip', 'IP'],
    ['vehicle_plate', 'Placa'],
    ['vehicle_engine', 'Motor'],
    ['vehicle_chassis', 'Chasis'],
    ['vehicle_mileage', 'Kilometraje'],
    ['cadastral_number', 'Número catastral'],
    ['real_estate_area_m2', 'Área (m²)'],
    ['real_estate_address', 'Dirección'],
    ['real_estate_location_geo', 'Ubicación geográfica'],
    ['property_material', 'Material'],
    ['property_dimensions', 'Dimensiones'],
    ['observation', 'Observaciones'],
    ['transferdate', 'Fecha de traslado'],
  ];

  return requests.map((request) => {
    const payload = request.payload || {};
    const display_data = [];
    if (request.type === 'MODEL') {
      display_data.push({ label: 'Modelo', value: payload.name });
      display_data.push({
        label: 'Marca',
        value: maps.brands.get(Number(payload.id_brand))?.name || 'No encontrada',
      });
      display_data.push({
        label: 'Tipo de activo',
        value:
          payload.id_device == null
            ? 'Vehículos'
            : maps.devices.get(Number(payload.id_device))?.name || 'No encontrado',
      });
    } else if (request.type === 'BRAND' || request.type === 'DEVICE') {
      display_data.push({
        label: request.type === 'BRAND' ? 'Marca' : 'Tipo de activo',
        value: payload.name,
      });
    } else {
      for (const [key, label, mapName] of labels) {
        const raw = payload[key];
        if (raw === undefined || raw === null || raw === '') continue;
        let value = mapName ? maps[mapName].get(Number(raw)) : raw;
        if (key === 'classification_rule_id')
          value = value
            ? `${value.classification?.code_new || ''} · ${value.classification?.description || ''}`.trim()
            : null;
        if (key === 'id_brand') value = value?.name;
        if (key === 'id_model')
          value = value ? `${value.brands?.name || ''} ${value.name}`.trim() : null;
        if (key === 'id_device' && Number.isInteger(Number(raw)))
          value = maps.devices.get(Number(raw))?.name;
        if (value !== undefined && value !== null && value !== '')
          display_data.push({ label, value });
      }
      const catalog = maps.vehicleCatalog.get(Number(payload.vehicle_catalog_id));
      if (catalog) {
        display_data.push({
          label: 'Configuración vehicular',
          value: `${catalog.brand.name} ${catalog.model.name} · ${catalog.model_year} · ${catalog.vehicle_type} · ${catalog.fuel_type}`,
        });
      }
      const rule = maps.rules.get(Number(payload.classification_rule_id));
      if (rule?.device?.name && !payload.id_device)
        display_data.push({ label: 'Tipo de activo', value: rule.device.name });
      if (rule?.administrative_area?.name && !payload.id_administrative_area)
        display_data.push({ label: 'Área administrativa', value: rule.administrative_area.name });
    }
    return { ...request, display_data };
  });
}

export const listMine = async (user) =>
  addDisplayData(
    await prisma.creation_requests.findMany({
      where: { requester_id: Number(user.id) },
      include: requestInclude,
      orderBy: { requested_at: 'desc' },
      take: 100,
    })
  );

export const listAll = async ({ status } = {}) =>
  addDisplayData(
    await prisma.creation_requests.findMany({
      where:
        status && ['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'].includes(status)
          ? { status }
          : {},
      include: requestInclude,
      orderBy: { requested_at: 'asc' },
      take: 300,
    })
  );

export const approve = async (idParam, reviewer) => {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) throw new AppError('ID de solicitud inválido.', 400);
  const request = await prisma.creation_requests.findUnique({
    where: { id },
    include: requestInclude,
  });
  if (!request) throw new AppError('Solicitud no encontrada.', 404);
  const retryingStaleRequest =
    request.status === 'PROCESSING' &&
    request.reviewed_at &&
    Date.now() - new Date(request.reviewed_at).getTime() > 15 * 60 * 1000;
  if (request.status !== 'PENDING' && !retryingStaleRequest) {
    throw new AppError('La solicitud ya fue revisada o está siendo procesada.', 409);
  }
  if (request.requester_id === Number(reviewer?.id))
    throw new AppError('No puedes aprobar tu propia solicitud.', 403);

  const claimed = await prisma.creation_requests.updateMany({
    where:
      request.status === 'PENDING'
        ? { id, status: 'PENDING' }
        : { id, status: 'PROCESSING', reviewed_at: request.reviewed_at },
    data: { status: 'PROCESSING', reviewer_id: Number(reviewer.id), reviewed_at: new Date() },
  });
  if (!claimed.count)
    throw new AppError('Otro administrador ya está procesando esta solicitud.', 409);

  try {
    if (request.type === 'INVENTORY') await createInventory(request.payload, reviewer);
    else if (request.type === 'BRAND') await createBrand(request.payload);
    else if (request.type === 'MODEL') await createModel(request.payload);
    else if (request.type === 'DEVICE') await createDevice(request.payload);
    else throw new AppError('Tipo de solicitud no válido.', 400);

    return await prisma.creation_requests.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewed_at: new Date(),
        review_notes: 'Aprobada. Registro creado correctamente.',
      },
      include: requestInclude,
    });
  } catch (error) {
    await prisma.creation_requests.updateMany({
      where: { id, status: 'PROCESSING' },
      data: {
        status: 'PENDING',
        reviewer_id: null,
        reviewed_at: null,
        review_notes: error.message || 'No se pudo crear el registro.',
      },
    });
    throw error;
  }
};

export const reject = async (idParam, { review_notes } = {}, reviewer) => {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) throw new AppError('ID de solicitud inválido.', 400);
  const request = await prisma.creation_requests.findUnique({ where: { id } });
  if (!request) throw new AppError('Solicitud no encontrada.', 404);
  if (request.requester_id === Number(reviewer?.id))
    throw new AppError('No puedes rechazar tu propia solicitud.', 403);
  const result = await prisma.creation_requests.updateMany({
    where: { id, status: 'PENDING' },
    data: {
      status: 'REJECTED',
      reviewer_id: Number(reviewer.id),
      review_notes: String(review_notes || '').trim() || null,
      reviewed_at: new Date(),
    },
  });
  if (!result.count) throw new AppError('La solicitud ya fue revisada o está en proceso.', 409);
  return prisma.creation_requests.findUnique({ where: { id }, include: requestInclude });
};
