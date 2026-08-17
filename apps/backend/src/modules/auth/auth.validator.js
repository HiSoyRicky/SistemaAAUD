// auth.validator.js

import {
  parseWithZod,
  z,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';

const registerSchema = z.object({
  username: zRequiredString('El usuario es requerido').refine(
    (value) => {
      const len = String(value).trim().length;
      return len >= 3 && len <= 30;
    },
    { message: 'El usuario debe tener entre 3 y 30 caracteres' }
  ),
  password: zRequiredString('La contraseña es requerida')
    .refine((value) => String(value).length >= 8, {
      message: 'La contraseña debe tener al menos 8 caracteres',
    })
    .refine((value) => /[A-Z]/.test(String(value)), {
      message: 'La contraseña debe incluir al menos una mayúscula',
    })
    .refine((value) => /[a-z]/.test(String(value)), {
      message: 'La contraseña debe incluir al menos una minúscula',
    })
    .refine((value) => /\d/.test(String(value)), {
      message: 'La contraseña debe incluir al menos un número',
    }),
  nombre_completo: zRequiredString('El nombre completo es requerido').refine(
    (value) => {
      const len = String(value).trim().length;
      return len >= 3 && len <= 100;
    },
    { message: 'El nombre completo debe tener entre 3 y 100 caracteres' }
  ),
  id_rol: zRequiredInt('Rol inválido', { min: 1 }),
});

const loginSchema = z.object({
  username: zRequiredString('Usuario requerido'),
  password: zRequiredString('Contraseña requerida'),
});

export const validateRegisterPayload = (payload) => {
  return parseWithZod(registerSchema, payload);
};

export const validateLoginPayload = (payload) => {
  return parseWithZod(loginSchema, payload);
};
