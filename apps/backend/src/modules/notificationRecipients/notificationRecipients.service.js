// notificationRecipients.service.js

import AppError from '../../common/utils/AppError.js';
import * as repository from './notificationRecipients.repository.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getAll = async () => repository.findAll();

export const getActiveEmails = async () => {
  const rows = await repository.findActiveEmails();
  return rows.map((row) => row.email);
};

export const create = async ({ email }, currentUser) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new AppError('El correo proporcionado no es válido', 400);
  }

  const existing = await repository.findByEmail(normalizedEmail);
  if (existing) {
    throw new AppError('Ese correo ya está registrado', 409);
  }

  return repository.create({ email: normalizedEmail, createdBy: currentUser?.id });
};

export const remove = async (id) => repository.remove(id);

export const setActive = async (id, active) => repository.setActive(id, Boolean(active));
