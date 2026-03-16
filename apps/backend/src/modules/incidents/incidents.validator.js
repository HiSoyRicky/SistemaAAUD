import {
  z,
  validateZod,
  zRequiredInt,
  zRequiredString
} from '../../common/utils/zodValidation.js';
import { validatePostIncident } from './incident.validator.js';

const incidentIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 })
});

const deleteIncidentBodySchema = z.object({
  password: zRequiredString('Contraseña requerida').refine(
    (value) => String(value).length >= 6,
    { message: 'Contraseña demasiado corta' }
  )
}).passthrough();

const validateUpdateIncident = validateZod({ params: incidentIdParamsSchema });

const validateDeleteIncident = validateZod({
  params: incidentIdParamsSchema,
  body: deleteIncidentBodySchema
});

export const validateCreateIncident = validatePostIncident;
export { validateUpdateIncident, validateDeleteIncident };
