// permissions.validator.js

import { validateZod, z, zRequiredInt } from '../../common/utils/zodValidation.js';

const roleParamsSchema = z.object({
  idRole: zRequiredInt('Rol inválido', { min: 1 }),
});

const userParamsSchema = z.object({
  idUser: zRequiredInt('Usuario inválido', { min: 1 }),
});

const updateRolePermissionsBodySchema = z.object({
  permissions: z
    .array(z.string({ required_error: 'Permiso inválido' }).trim().min(3, 'Permiso inválido'))
    .default([]),
});

const updateUserPermissionsBodySchema = z.object({
  grants: z
    .array(z.string({ required_error: 'Permiso inválido' }).trim().min(3, 'Permiso inválido'))
    .default([]),
  denies: z
    .array(z.string({ required_error: 'Permiso inválido' }).trim().min(3, 'Permiso inválido'))
    .default([]),
});

export const validateRoleParams = validateZod({
  params: roleParamsSchema,
  assignParsed: true,
});

export const validateUpdateRolePermissions = validateZod({
  params: roleParamsSchema,
  body: updateRolePermissionsBodySchema,
  assignParsed: true,
});

export const validateUserParams = validateZod({
  params: userParamsSchema,
  assignParsed: true,
});

export const validateUpdateUserPermissions = validateZod({
  params: userParamsSchema,
  body: updateUserPermissionsBodySchema,
  assignParsed: true,
});
