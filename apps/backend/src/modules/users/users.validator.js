// users.validator.js

import {
  validateZod,
  z,
  zEmail,
  zOptionalNonEmptyField,
  zOptionalString,
  zOptionalInt,
  zOptionalNullableString,
  zRequiredField,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';

const userIdParamsSchema = z.object({
  id: zRequiredInt('ID de usuario inválido', { min: 1 }),
});

const createUserBodySchema = z.object({
  username: zRequiredString('El nombre de usuario es requerido'),
  password: zRequiredString('La contraseña es requerida'),
  email: zEmail('El correo electrónico no es válido'),
  id_rol: zRequiredField('El rol es requerido'),
  id_ubication: zOptionalInt('La ubicación no es válida', { min: 1, nullable: true }),
  id_department: zOptionalInt('El departamento no es válido', {
    min: 1,
    nullable: true,
    allowEmptyString: true,
  }),
  active: z.any().optional(),
});

const updateUserBodySchema = z.object({
  username: zOptionalNonEmptyField('El nombre de usuario no puede estar vacío'),
  nombre_completo: zOptionalNonEmptyField('El nombre completo no puede estar vacío'),
  id_rol: zOptionalNonEmptyField('El rol no puede estar vacío'),
  email: zOptionalNullableString('El correo no es válido'),
  id_ubication: zOptionalInt('La ubicación no es válida', { min: 1, nullable: true }),
  id_department: zOptionalInt('El departamento no es válido', {
    min: 1,
    nullable: true,
    allowEmptyString: true,
  }),
  active: z.any().optional(),
});

const updatePasswordBodySchema = z.object({
  newPassword: zRequiredString('La nueva contraseña es requerida'),
});

const searchUsersQuerySchema = z.object({
  q: zOptionalString('Parámetro de búsqueda inválido'),
});

const validateUserId = validateZod({ params: userIdParamsSchema });
const validateCreateUser = validateZod({ body: createUserBodySchema });

const validateUpdateUser = validateZod({
  params: userIdParamsSchema,
  body: updateUserBodySchema,
});

const validateUpdatePassword = validateZod({
  params: userIdParamsSchema,
  body: updatePasswordBodySchema,
});

const validateSearchUsers = validateZod({ query: searchUsersQuerySchema });

export {
  validateCreateUser,
  validateSearchUsers,
  validateUpdatePassword,
  validateUpdateUser,
  validateUserId,
};
