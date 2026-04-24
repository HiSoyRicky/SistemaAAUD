import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.categories.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' }
  });
};