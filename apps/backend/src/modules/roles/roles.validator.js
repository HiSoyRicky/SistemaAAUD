import { validateZod, z, zRequiredInt, zRequiredString } from '../../common/utils/zodValidation.js';

const idParamsSchema = z.object({ id: zRequiredInt('Rol inválido', { min: 1 }) });
const roleBodySchema = z.object({ name: zRequiredString('El nombre del rol es requerido') });

export const validateRoleId = validateZod({ params: idParamsSchema, assignParsed: true });
export const validateCreateRole = validateZod({ body: roleBodySchema, assignParsed: true });
export const validateUpdateRole = validateZod({ params: idParamsSchema, body: roleBodySchema, assignParsed: true });