import { PrismaClient } from '@prisma/client';
import { getPrismaWithActivityLogger, activityContext } from "../common/services/activityLogger.js";

const prismaClient = new PrismaClient();

export const prisma = getPrismaWithActivityLogger(prismaClient);
export { activityContext };