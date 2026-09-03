import { validateZod, z, zOptionalInt, zRequiredInt } from '../../common/utils/zodValidation.js';

const ruleIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const activeSchema = z
  .any()
  .optional()
  .refine((value) => typeof value === 'boolean' || value === 'true' || value === 'false' || value === undefined, {
    message: 'El campo active debe ser booleano',
  });

const ruleBodySchema = z.object({
  device_id: zOptionalInt('El campo device_id debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
    min: 1,
  }),
  classification_id: zRequiredInt('El campo classification_id es obligatorio', { min: 1 }),
  asset_type_id: zRequiredInt('El campo asset_type_id es obligatorio', { min: 1 }),
  extension_id: zOptionalInt('El campo extension_id debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
    min: 1,
  }),
  administrative_area_id: zOptionalInt(
    'El campo administrative_area_id debe ser un número entero',
    { nullable: true, allowEmptyString: true, min: 1 }
  ),
  active: activeSchema,
  is_default: z
    .any()
    .optional()
    .refine((value) => typeof value === 'boolean' || value === undefined, {
      message: 'El campo is_default debe ser booleano',
    }),
});

const listQuerySchema = z.object({
  page: zOptionalInt('Página inválida', { min: 1 }),
  limit: zOptionalInt('Límite inválido', { min: 1, max: 200 }),
  device_id: zOptionalInt('El device_id debe ser un número entero', { min: 1 }),
  asset_type_id: zOptionalInt('El asset_type_id debe ser un número entero', { min: 1 }),
  extension_id: zOptionalInt('El extension_id debe ser un número entero', { min: 1 }),
  administrative_area_id: zOptionalInt('El administrative_area_id debe ser un número entero', { min: 1 }),
  active: activeSchema,
});

const resolveBodySchema = z.object({
  device_id: zOptionalInt('El device_id debe ser un número entero', { nullable: true, allowEmptyString: true, min: 1 }),
  asset_type_id: zOptionalInt('El asset_type_id debe ser un número entero', { nullable: true, allowEmptyString: true, min: 1 }),
  extension_id: zOptionalInt('El extension_id debe ser un número entero', { nullable: true, allowEmptyString: true, min: 1 }),
  administrative_area_id: zOptionalInt('El administrative_area_id debe ser un número entero', { nullable: true, allowEmptyString: true, min: 1 }),
});

export const validateCreateClassificationRule = validateZod({ body: ruleBodySchema });
export const validateUpdateClassificationRule = validateZod({
  params: ruleIdParamsSchema,
  body: ruleBodySchema,
});
export const validateClassificationRuleId = validateZod({ params: ruleIdParamsSchema });
export const validateListClassificationRules = validateZod({ query: listQuerySchema });
export const validateResolveClassificationRule = validateZod({ body: resolveBodySchema });
export { ruleBodySchema, listQuerySchema, resolveBodySchema };