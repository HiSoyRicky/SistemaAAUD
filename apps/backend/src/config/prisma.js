import { PrismaClient } from '@prisma/client';
import { getPrismaWithActivityLogger } from "../common/services/activityLogger.js";

const prismaClient = new PrismaClient();

export const prisma = getPrismaWithActivityLogger(prismaClient);