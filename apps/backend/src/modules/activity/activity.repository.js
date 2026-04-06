import { prisma } from '../../config/prisma.js';

export const getActivityLogs = async ({
  page = 1,
  limit = 50,
  entityType,
  entityId,
  action,
  userId,
  from,
  to
}) => {
  const where = {
    ...(entityType && { entity_type: entityType }),
    ...(entityId && { entity_id: Number(entityId) }),
    ...(action && { action }),
    ...(userId && { user_id: Number(userId) }),
    ...((from || to) && {
      created_at: {
        ...(from && { gte: from }),
        ...(to && { lte: to })
      }
    })
  };

  const [data, total] = await prisma.$transaction([
    prisma.activity_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, nombre_completo: true } }
      }
    }),
    prisma.activity_logs.count({ where })
  ]);

  return { data, total };
};
