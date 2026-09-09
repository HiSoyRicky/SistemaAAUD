// notificationRecipients.repository.js

import { prisma } from '../../config/prisma.js';

export const findAll = async () =>
  prisma.incident_notification_recipients.findMany({
    orderBy: { email: 'asc' },
  });

export const findActiveEmails = async () =>
  prisma.incident_notification_recipients.findMany({
    where: { active: true },
    select: { email: true },
    orderBy: { email: 'asc' },
  });

export const findByEmail = async (email) =>
  prisma.incident_notification_recipients.findUnique({ where: { email } });

export const create = async ({ email, createdBy }) =>
  prisma.incident_notification_recipients.create({
    data: { email, created_by: createdBy || null },
  });

export const remove = async (id) =>
  prisma.incident_notification_recipients.delete({ where: { id: Number(id) } });

export const setActive = async (id, active) =>
  prisma.incident_notification_recipients.update({
    where: { id: Number(id) },
    data: { active },
  });
