// incidents.validator.js

import {
  validateZod,
  z,
  zOptionalDate,
  zOptionalEnum,
  zOptionalInt,
  zOptionalNullableString,
  zOptionalString,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';

export const createIncidentBodySchema = z.object({
  id_ubication: zRequiredInt('id_ubication debe ser un número entero'),
  id_department: zRequiredInt('id_department debe ser un número entero'),
  id_device: zOptionalInt('Equipo inválido', { min: 1, nullable: true }),
  id_printer_model: zOptionalInt('Modelo de impresora inválido', { min: 1, nullable: true }),
  id_toner: zOptionalInt('Tóner inválido', { min: 1, nullable: true }),
  toner_color: zOptionalNullableString('Color de tóner inválido'),
  description: zRequiredString('description es obligatorio').refine(
    (value) => typeof value === 'string' && value.length <= 255,
    { message: 'La descripción no puede exceder 255 caracteres' }
  ),
  id_category: zRequiredInt('id_category debe ser un número entero'),
  reporter_name: zRequiredString('reporter_name es obligatorio').refine(
    (value) => typeof value === 'string' && value.trim().length <= 35,
    { message: 'El nombre no puede exceder 35 caracteres' }
  ),
  email: zOptionalNullableString('Correo inválido').refine(
    (value) => value == null || value.length <= 50,
    { message: 'El correo no puede exceder 50 caracteres' }
  ),
  other_category_detail: zOptionalNullableString('Detalle de categoría inválido').refine(
    (value) => value == null || value.length <= 50,
    { message: 'El detalle no puede exceder 50 caracteres' }
  ),
}).strict();

const incidentIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const STATUS_IDS = { Pendiente: 1, Asignado: 2, Resuelto: 3 };

export const incidentUpdateBodySchema = z
  .object({
    description: z.string().trim().min(1).max(255).optional(),
    category: zOptionalInt('Categoría inválida', { min: 1 }),
    id_category: zOptionalInt('Categoría inválida', { min: 1 }),
    solution: zOptionalString('La solución debe ser texto').refine(
      (value) => value === undefined || value.length <= 255,
      { message: 'La solución no puede exceder 255 caracteres' }
    ),
    status: zOptionalEnum(['Pendiente', 'Asignado', 'Resuelto'], 'Estado inválido', {
      allowEmptyString: false,
    }),
    id_status: zOptionalInt('Estado inválido', { min: 1, max: 3, allowEmptyString: false }),
    solution_date: zOptionalDate('Fecha de solución inválida', { nullable: true }),
    id_technician: zOptionalInt('Técnico inválido', { min: 1, allowEmptyString: false }),
    silent: z.boolean().optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Debe indicar al menos un campo para actualizar',
  })
  .refine(
    (payload) =>
      payload.category === undefined ||
      payload.id_category === undefined ||
      Number(payload.category) === Number(payload.id_category),
    { message: 'Las categorías indicadas no coinciden', path: ['id_category'] }
  )
  .refine(
    (payload) =>
      payload.status === undefined ||
      payload.id_status === undefined ||
      STATUS_IDS[payload.status] === Number(payload.id_status),
    { message: 'Los estados indicados no coinciden', path: ['id_status'] }
  )
  .refine(
    (payload) => {
      if (payload.id_technician === undefined) return true;
      const requestedStatus =
        payload.status === undefined ? Number(payload.id_status) : STATUS_IDS[payload.status];
      return !requestedStatus || requestedStatus === 2;
    },
    { message: 'La asignación solo puede establecer el estado Asignado', path: ['status'] }
  );

const deleteIncidentBodySchema = z.object({
  password: zRequiredString('Contraseña requerida').refine((value) => String(value).length >= 6, {
    message: 'Contraseña demasiado corta',
  }),
});

const validateCreateIncident = validateZod({
  body: createIncidentBodySchema,
});

const validateUpdateIncident = validateZod({
  params: incidentIdParamsSchema,
});

const validateUpdateIncidentBody = validateZod({ body: incidentUpdateBodySchema });

const validateDeleteIncident = validateZod({
  params: incidentIdParamsSchema,
  body: deleteIncidentBodySchema,
});

export {
  validateCreateIncident,
  validateDeleteIncident,
  validateUpdateIncident,
  validateUpdateIncidentBody,
};
