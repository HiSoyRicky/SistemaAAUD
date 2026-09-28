// health.service.js

import { prisma } from '../../config/prisma.js';

export async function checkHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'ok',
    };
  } catch (error) {
    return {
      status: 'error',
      database: 'error',
    };
  }
}
