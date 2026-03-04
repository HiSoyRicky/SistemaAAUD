import AppError from '../../utils/AppError.js';
import { parseDateOnly, parseDateTime } from '../../utils/dateParser.js';
import * as repository from './documents.repository.js';
import { mapDocumentList, mapUploadResponse } from './documents.dto.js';

const normalize = (s) =>
  (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isAdminRole = (roleName) => {
  return ['administrador', 'admin'].includes(normalize(roleName));
};

const parseCompositeParams = (params) => {
  const parsed = {
    id: Number(params.id),
    id_ubication: Number(params.id_ubication),
    id_department: Number(params.id_department),
    id_doc_type: Number(params.id_doc_type)
  };

  for (const [key, value] of Object.entries(parsed)) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new AppError(`Parámetro inválido: ${key}`, 400);
    }
  }

  return parsed;
};

export const getDocTypes = async () => {
  return repository.findDocTypes();
};

export const getExternalEntities = async () => {
  return repository.findExternalEntities();
};

export const getAll = async (ctx) => {
  const { deptId, roleName } = ctx || {};
  const isAdmin = isAdminRole(roleName);

  if (!isAdmin && !deptId) {
    throw new AppError('Tu usuario no tiene departamento asignado', 403);
  }

  const where = isAdmin ? {} : { id_department: Number(deptId) };
  const documents = await repository.findDocuments(where);

  return mapDocumentList(documents);
};

export const getByKey = async (params, ctx) => {
  const parsedParams = parseCompositeParams(params);
  const { deptId, roleName } = ctx || {};
  const isAdmin = isAdminRole(roleName);

  if (!isAdmin && !deptId) {
    throw new AppError('Tu usuario no tiene departamento asignado', 403);
  }

  const doc = await repository.findDocumentByKey(parsedParams);
  if (!doc) {
    throw new AppError('Documento no encontrado', 404);
  }

  if (!isAdmin && doc.id_department !== Number(deptId)) {
    throw new AppError('No tienes acceso a este documento', 403);
  }

  return doc;
};

export const create = async (payload, currentUser) => {
  const userId = Number(currentUser?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('No autenticado', 401);
  }

  const user = await repository.findUserContextById(userId);
  if (!user?.id_department || !user?.id_ubication) {
    throw new AppError(
      'Tu usuario no tiene ubicación/departamento asignado',
      400
    );
  }

  const y = Number(payload.year);
  const type = Number(payload.id_doc_type);

  const last = await repository.findLastConsecutive({
    dept: user.id_department,
    type,
    year: y
  });

  const nextConsecutive = (last?.consecutive ?? 0) + 1;

  return repository.createDocument({
    id_ubication: user.id_ubication,
    id_department: user.id_department,
    id_doc_type: type,

    direction: payload.direction,
    year: y,
    consecutive: nextConsecutive,

    id_origin: payload.id_origin ? Number(payload.id_origin) : null,
    sent_by: payload.sent_by ?? null,
    sent_to: payload.sent_to ?? null,

    document_date: parseDateOnly(payload.document_date),
    received_at: parseDateTime(payload.received_at),
    sent_at: parseDateTime(payload.sent_at),
    closed_at: parseDateTime(payload.closed_at),

    subject: payload.subject ?? null,
    description: payload.description ?? null,
    observations: payload.observations ?? null,
    attachment: payload.attachment ?? null,

    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  });
};

export const update = async ({ params, payload, currentUser }) => {
  const parsedParams = parseCompositeParams(params);
  const userId = Number(currentUser?.id);
  const roleName = currentUser?.role_name;

  const existing = await repository.findDocumentMetaByKey(parsedParams);
  if (!existing) {
    throw new AppError('Documento no encontrado', 404);
  }

  const isAdmin = roleName === 'Administrador' || roleName === 'admin';
  const isOwner = existing.created_by === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError('No puedes editar este documento', 403);
  }

  return repository.updateDocumentByKey(parsedParams, {
    direction: payload.direction ?? undefined,
    year: payload.year !== undefined ? Number(payload.year) : undefined,
    consecutive:
      payload.consecutive !== undefined ? Number(payload.consecutive) : undefined,
    id_origin:
      payload.id_origin !== undefined
        ? payload.id_origin
          ? Number(payload.id_origin)
          : null
        : undefined,

    sent_by: payload.sent_by !== undefined ? payload.sent_by : undefined,
    sent_to: payload.sent_to !== undefined ? payload.sent_to : undefined,

    document_date:
      payload.document_date !== undefined
        ? parseDateOnly(payload.document_date)
        : undefined,
    received_at:
      payload.received_at !== undefined
        ? parseDateTime(payload.received_at)
        : undefined,
    sent_at:
      payload.sent_at !== undefined ? parseDateTime(payload.sent_at) : undefined,
    closed_at:
      payload.closed_at !== undefined
        ? parseDateTime(payload.closed_at)
        : undefined,

    subject: payload.subject !== undefined ? payload.subject : undefined,
    description:
      payload.description !== undefined ? payload.description : undefined,
    observations:
      payload.observations !== undefined ? payload.observations : undefined,
    attachment: payload.attachment !== undefined ? payload.attachment : undefined,

    updated_at: new Date()
  });
};

export const remove = async (params) => {
  const parsedParams = parseCompositeParams(params);
  await repository.deleteDocumentByKey(parsedParams);

  return { message: 'Documento eliminado' };
};

export const uploadFile = async (file) => {
  if (!file) {
    throw new AppError('Archivo requerido', 400);
  }

  return mapUploadResponse(file.filename);
};
