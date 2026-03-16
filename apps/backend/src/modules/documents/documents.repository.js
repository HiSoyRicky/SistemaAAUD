import { prisma } from '../../config/prisma.js';

const documentSelect = {
  id: true,
  id_ubication: true,
  id_department: true,
  id_doc_type: true,

  direction: true,
  year: true,
  consecutive: true,
  id_origin: true,

  sent_by: true,
  sent_to: true,

  document_date: true,
  received_at: true,
  sent_at: true,
  closed_at: true,

  subject: true,
  description: true,
  observations: true,
  attachment: true,

  created_by: true,
  created_at: true,
  updated_at: true,

  ubications: { select: { name: true } },
  departments: { select: { name: true } },
  doc_type: { select: { name: true } },
  external_entities: { select: { name: true } },
  users: { select: { id: true, nombre_completo: true, username: true } }
};

const composeDocumentKey = ({ id, id_ubication, id_department, id_doc_type }) => {
  return {
    id_id_ubication_id_department_id_doc_type: {
      id: Number(id),
      id_ubication: Number(id_ubication),
      id_department: Number(id_department),
      id_doc_type: Number(id_doc_type)
    }
  };
};

export const findDocTypes = async () => {
  return prisma.doc_type.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
};

export const findExternalEntities = async () => {
  return prisma.external_entities.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
};

export const findDocuments = async (where) => {
  return prisma.bd_documents.findMany({
    where,
    select: documentSelect,
    orderBy: [{ year: 'desc' }, { consecutive: 'desc' }]
  });
};

export const findDocumentByKey = async (params) => {
  return prisma.bd_documents.findUnique({
    where: composeDocumentKey(params)
  });
};

export const findDocumentMetaByKey = async (params) => {
  return prisma.bd_documents.findUnique({
    where: composeDocumentKey(params),
    select: { created_by: true, id_department: true }
  });
};

export const findUserContextById = async (userId) => {
  return prisma.users.findUnique({
    where: { id: Number(userId) },
    select: { id: true, id_ubication: true, id_department: true }
  });
};

export const findLastConsecutive = async ({ dept, type, year }) => {
  return prisma.bd_documents.findFirst({
    where: {
      id_department: Number(dept),
      id_doc_type: Number(type),
      year: Number(year)
    },
    orderBy: { consecutive: 'desc' },
    select: { consecutive: true }
  });
};

export const createDocument = async (data) => {
  return prisma.bd_documents.create({ data });
};

export const updateDocumentByKey = async (params, data) => {
  return prisma.bd_documents.update({
    where: composeDocumentKey(params),
    data
  });
};

export const deleteDocumentByKey = async (params) => {
  return prisma.bd_documents.delete({
    where: composeDocumentKey(params)
  });
};
