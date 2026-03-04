import {
  z,
  validateZod,
  zRequiredInt,
  zRequiredString
} from '../../utils/zodValidation.js';

const createIncidentBodySchema = z.object({
  id_user: zRequiredInt('id_user debe ser un número entero'),
  id_ubication: zRequiredInt('id_ubication debe ser un número entero'),
  id_department: zRequiredInt('id_department debe ser un número entero'),
  description: zRequiredString('description es obligatorio'),
  id_category: zRequiredInt('id_category debe ser un número entero'),
  reporter_name: zRequiredString('reporter_name es obligatorio')
}).passthrough();

const validatePostIncident = validateZod({ body: createIncidentBodySchema });

export { validatePostIncident };
