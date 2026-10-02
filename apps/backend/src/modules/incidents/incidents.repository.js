// incidents.repository.js

import { prisma } from '../../config/prisma.js';

const listSelect = {
  id: true,
  ticket_number: true,
  id_user: true,
  reporter_name: true,
  email: true,
  description: true,
  id_category: true,
  other_category_detail: true,
  id_status: true,
  creation_date: true,
  assigned_at: true,
  assigned_by: true,
  solution_date: true,
  solution: true,
  id_technician: true,
  categories: {
    select: { name: true },
  },
  users_bd_incidents_id_assigned_byTousers: {
    select: { nombre_completo: true },
  },
  ubications: {
    select: { name: true },
  },
  departments: {
    select: { name: true },
  },
  users_bd_incidents_id_technicianTousers: {
    select: { nombre_completo: true },
  },
};

const detailSelect = {
  id: true,
  ticket_number: true,
  reporter_name: true,
  email: true,
  description: true,
  other_category_detail: true,
  creation_date: true,
  assigned_at: true,
  solution: true,
  solution_date: true,
  id_status: true,
  id_technician: true,
  assigned_by: true,
  ubications: { select: { name: true } },
  departments: { select: { name: true } },
  categories: { select: { name: true } },
  users_bd_incidents_id_technicianTousers: {
    select: {
      nombre_completo: true,
      email: true,
    },
  },
  users_bd_incidents_id_assigned_byTousers: {
    select: { nombre_completo: true },
  },
};

const OPTIONAL_INCIDENT_COLUMNS = [
  {
    column: 'assigned_by',
    fields: ['assigned_by', 'users_bd_incidents_id_assigned_byTousers'],
  },
];

function missingOptionalIncidentColumn(error) {
  const missingColumn = String(error?.meta?.column || error?.message || '').toLowerCase();
  if (error?.code !== 'P2022') return null;
  return OPTIONAL_INCIDENT_COLUMNS.find(({ column }) => missingColumn.includes(column)) || null;
}

export async function queryIncidentsWithAssignmentFallback(query, queryRunner) {
  let compatibleQuery = query;

  try {
    for (let attempts = 0; attempts <= OPTIONAL_INCIDENT_COLUMNS.length; attempts += 1) {
      try {
        return await queryRunner(compatibleQuery);
      } catch (error) {
        const missingColumn = missingOptionalIncidentColumn(error);
        if (!missingColumn) throw error;

        compatibleQuery = { ...compatibleQuery, select: { ...compatibleQuery.select } };
        missingColumn.fields.forEach((field) => delete compatibleQuery.select[field]);
      }
    }
  } catch (error) {
    throw error;
  }

  throw new Error('No se pudo consultar el historial compatible de incidencias');
}

export async function hasIncidentAssigneeColumn(db = prisma) {
  const rows = await db.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'bd_incidents'
        AND column_name = 'assigned_by'
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export const findAll = async ({ technicianId } = {}) => {
  const query = {
    where: technicianId ? { id_technician: Number(technicianId) } : undefined,
    select: listSelect,
  };
  return queryIncidentsWithAssignmentFallback(query, (args) => prisma.bd_incidents.findMany(args));
};

export const findById = async (id) => {
  const query = {
    where: { id: Number(id) },
    select: detailSelect,
  };
  return queryIncidentsWithAssignmentFallback(query, (args) => prisma.bd_incidents.findUnique(args));
};

export const findUserPasswordById = async (id) => {
  return prisma.users.findUnique({
    where: { id: Number(id) },
    select: { password: true },
  });
};

export const findDepartmentById = async (id) => {
  return prisma.departments.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      id_ubication: true,
    },
  });
};

export const findPrinterModelsWithTonersByLocationDepartment = async ({
  id_ubication,
  id_department,
}) => {
  return prisma.models.findMany({
    where: {
      devices: {
        name: 'Impresora',
      },
      inventory_devices: {
        some: {
          inventory: {
            is: {
              id_ubication: Number(id_ubication),
              id_department: Number(id_department),
            },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      brands: {
        select: {
          name: true,
        },
      },
      toners: {
        select: {
          id: true,
          color: true,
          toner_model: true,
        },
        orderBy: [{ color: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const deleteById = async (id) => {
  return prisma.bd_incidents.deleteMany({
    where: { id: Number(id) },
  });
};
