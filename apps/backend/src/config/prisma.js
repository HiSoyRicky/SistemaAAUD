import { PrismaClient } from '@prisma/client';
import { getPrismaWithActivityLogger } from "../common/services/activityLogger.js";
import {AsyncLocalStorage} from "async_hooks";

export const activityContext = new AsyncLocalStorage();

const prismaClient = new PrismaClient();

export const prisma = getPrismaWithActivityLogger(prismaClient);