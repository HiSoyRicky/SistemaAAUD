// activity.repository.js

import { prisma } from '../../config/prisma.js';

export const getActivityLogs = async ({
  page = 1,
  limit = 50,
  entityType,
  entityTypes,
  entityId,
  action,
  userId,
  userName,
  from,
  to,
}) => {
  const trimmedUserName = String(userName || '').trim();
  const userNameFilter =
    trimmedUserName && trimmedUserName.toLowerCase() !== 'sistema'
      ? {
          user: {
            is: {
              nombre_completo: {
                contains: trimmedUserName,
                mode: 'insensitive',
              },
            },
          },
        }
      : null;

  const where = {
    ...(entityTypes?.length
      ? { entity_type: { in: entityTypes } }
      : entityType && { entity_type: entityType }),
    ...(entityId && { entity_id: Number(entityId) }),
    ...(action && { action }),
    ...(userId && { user_id: Number(userId) }),
    ...(trimmedUserName.toLowerCase() === 'sistema' && { user_id: null }),
    ...userNameFilter,
    ...((from || to) && {
      created_at: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
  };

  const [data, total, actionSummary] = await prisma.$transaction([
    prisma.activity_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, nombre_completo: true } },
      },
    }),
    prisma.activity_logs.count({ where }),
    prisma.activity_logs.groupBy({
      by: ['action'],
      where,
      _count: {
        _all: true,
      },
    }),
  ]);

  const summary = actionSummary.reduce((counts, item) => {
    counts[item.action] = item._count._all;
    return counts;
  }, {});

  return { data, total, summary };
};
