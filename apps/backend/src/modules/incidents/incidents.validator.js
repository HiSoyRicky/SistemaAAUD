// incidents.validator.js

import { validateZod, z, zRequiredInt, zRequiredString } from '../../common/utils/zodValidation.js';

const createIncidentBodySchema = z.object({
  id_user: zRequiredInt('id_user debe ser un número entero'),
  id_ubication: zRequiredInt('id_ubication debe ser un número entero'),
  id_department: zRequiredInt('id_department debe ser un número entero'),
  description: zRequiredString('description es obligatorio'),
  id_category: zRequiredInt('id_category debe ser un número entero'),
  reporter_name: zRequiredString('reporter_name es obligatorio'),
});

const incidentIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

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

const validateDeleteIncident = validateZod({
  params: incidentIdParamsSchema,
  body: deleteIncidentBodySchema,
});

export { validateCreateIncident, validateDeleteIncident, validateUpdateIncident };
