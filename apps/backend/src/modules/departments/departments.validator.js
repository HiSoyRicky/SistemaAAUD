// departments.validator.js

import {
  validateZod,
  z,
  zRequiredField,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';

const departmentIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const createDepartmentBodySchema = z.object({
  name: zRequiredString('El nombre es requerido'),
  id_ubication: zRequiredField('La ubicación es requerida'),
});

const updateDepartmentBodySchema = z.object({
  name: zRequiredString('El nombre es requerido'),
  id_ubication: zRequiredField('La ubicación es requerida').refine(
    (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
    { message: 'ID de ubicación inválido' }
  ),
});

const validateCreateDepartment = validateZod({
  body: createDepartmentBodySchema,
});

const validateUpdateDepartment = validateZod({
  params: departmentIdParamsSchema,
  body: updateDepartmentBodySchema,
});

const validateDeleteDepartment = validateZod({
  params: departmentIdParamsSchema,
});

export { validateCreateDepartment, validateDeleteDepartment, validateUpdateDepartment };
