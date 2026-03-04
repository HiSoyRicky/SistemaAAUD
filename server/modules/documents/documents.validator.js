import {
  z,
  validateZod,
  zRequiredInt,
  zRequiredField
} from '../../utils/zodValidation.js';

const compositeParamsSchema = z.object({
  id: zRequiredInt('id inválido', { min: 1 }),
  id_ubication: zRequiredInt('id_ubication inválido', { min: 1 }),
  id_department: zRequiredInt('id_department inválido', { min: 1 }),
  id_doc_type: zRequiredInt('id_doc_type inválido', { min: 1 })
});

const createDocumentBodySchema = z.object({
  id_doc_type: zRequiredField('id_doc_type es requerido').refine(
    (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
    { message: 'id_doc_type inválido' }
  ),
  year: zRequiredField('year es requerido').refine(
    (value) => Number.isInteger(Number(value)) && Number(value) >= 2000 && Number(value) <= 3000,
    { message: 'year inválido' }
  )
}).passthrough();

const validateCompositeParams = validateZod({ params: compositeParamsSchema });
const validateCreateDocument = validateZod({ body: createDocumentBodySchema });

export { validateCompositeParams, validateCreateDocument };
