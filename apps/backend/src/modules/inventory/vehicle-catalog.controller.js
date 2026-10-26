import { prisma } from '../../config/prisma.js';
import AppError from '../../common/utils/AppError.js';
import catchAsync from '../../common/utils/catchAsync.js';
import normalizeCatalogName from '../../common/utils/normalizeCatalogName.js';

const include = { brand: { select: { id: true, name: true } }, model: { select: { id: true, name: true, id_brand: true } } };

async function normalize(payload) {
  const id_brand = Number(payload.id_brand);
  const id_model = Number(payload.id_model);
  const model_year = Number(payload.model_year);
  const vehicle_type = String(payload.vehicle_type || '').trim();
  const fuel_type = String(payload.fuel_type || '').trim();
  if (!Number.isInteger(id_brand) || id_brand < 1 || !Number.isInteger(id_model) || id_model < 1) {
    throw new AppError('Seleccione una marca y un modelo válidos', 400);
  }
  if (!Number.isInteger(model_year) || model_year < 1886 || model_year > 2200) {
    throw new AppError('El año del modelo debe estar entre 1886 y 2200', 400);
  }
  if (!vehicle_type || vehicle_type.length > 50 || !fuel_type || fuel_type.length > 30) {
    throw new AppError('Seleccione el tipo de vehículo y combustible', 400);
  }
  const [brand, model] = await Promise.all([
    prisma.brands.findUnique({ where: { id: id_brand } }),
    prisma.models.findUnique({ where: { id: id_model } }),
  ]);
  if (!brand || !model || model.id_brand !== id_brand || model.id_device !== null) {
    throw new AppError('El modelo no pertenece a la marca seleccionada', 400);
  }
  return { id_brand, id_model, model_year, vehicle_type, fuel_type };
}

export const getAll = catchAsync(async (_req, res) => {
  try {
    const entries = await prisma.inventory_vehicle_catalog.findMany({
      include,
      orderBy: [{ brand: { name: 'asc' } }, { model: { name: 'asc' } }, { model_year: 'desc' }],
    });
    res.json(entries);
  } catch (error) {
    if (error?.code === 'P2021') {
      throw new AppError(
        'Falta aplicar la migración del catálogo de vehículos (20261020120000_vehicle_catalog).',
        503,
        'VEHICLE_CATALOG_MIGRATION_REQUIRED'
      );
    }
    throw error;
  }
});

export const create = catchAsync(async (req, res) => {
  const data = await normalize(req.body);
  const candidates = await prisma.inventory_vehicle_catalog.findMany({
    where: { id_brand: data.id_brand, id_model: data.id_model, model_year: data.model_year },
    select: { id: true, vehicle_type: true, fuel_type: true },
  });
  const duplicate = candidates.find((entry) =>
    normalizeCatalogName(entry.vehicle_type) === normalizeCatalogName(data.vehicle_type) &&
    normalizeCatalogName(entry.fuel_type) === normalizeCatalogName(data.fuel_type)
  );
  if (duplicate) throw new AppError('Esta combinación ya existe en el catálogo de vehículos', 409);
  const entry = await prisma.inventory_vehicle_catalog.create({ data, include });
  res.status(201).json(entry);
});

export const update = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new AppError('ID inválido', 400);
  const data = await normalize(req.body);
  const candidates = await prisma.inventory_vehicle_catalog.findMany({
    where: { id_brand: data.id_brand, id_model: data.id_model, model_year: data.model_year, id: { not: id } },
    select: { id: true, vehicle_type: true, fuel_type: true },
  });
  const duplicate = candidates.find((entry) =>
    normalizeCatalogName(entry.vehicle_type) === normalizeCatalogName(data.vehicle_type) &&
    normalizeCatalogName(entry.fuel_type) === normalizeCatalogName(data.fuel_type)
  );
  if (duplicate) throw new AppError('Esta combinación ya existe en el catálogo de vehículos', 409);
  const entry = await prisma.inventory_vehicle_catalog.update({ where: { id }, data, include });
  res.json(entry);
});

