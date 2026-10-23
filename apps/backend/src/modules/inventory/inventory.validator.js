// inventory.validator.js

import {
  validateZod,
  z,
  zOptionalDate,
  zOptionalIP,
  zOptionalInt,
  zOptionalNullableString,
  zOptionalNonEmptyField,
  zRequiredInt,
  zRequiredString,
} from '../../common/utils/zodValidation.js';

const inventoryIdParamsSchema = z.object({
  id: zRequiredInt('ID inválido', { min: 1 }),
});

const createInventoryBodySchema = z.object({
  tag: zRequiredString('El campo tag es obligatorio'),
  description: zOptionalNonEmptyField('El campo description no puede estar vacío'),
  id_ubication: zOptionalInt('El campo id_ubication debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_department: zOptionalInt('El campo id_department debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  user: zOptionalNullableString('El campo user debe ser texto'),
  asset_type_id: zOptionalInt('El tipo de activo debe ser un número entero', { min: 1 }),
  classification_rule_id: zOptionalInt('La clasificación seleccionada no es válida', {
    nullable: true,
    min: 1,
  }),
  extension_id: zOptionalInt('La extensión seleccionada no es válida', { min: 1 }),
  id_administrative_area: zOptionalInt('El área administradora debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
    min: 1,
  }),
  id_device: zOptionalInt('El campo id_device debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_brand: zOptionalInt('El campo id_brand debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_model: zOptionalInt('El campo id_model debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  serie: zOptionalNullableString('El campo serie debe ser texto'),
  vehicle_catalog_id: zOptionalInt('La configuración del vehículo no es válida', { nullable: true, min: 1 }),
  vehicle_make: zOptionalNullableString('La marca del vehículo debe ser texto'),
  vehicle_model: zOptionalNullableString('El modelo del vehículo debe ser texto'),
  vehicle_model_year: zOptionalInt('El año del modelo debe ser un número entero', { nullable: true, min: 1886, max: 2200 }),
  vehicle_plate: zOptionalNullableString('La placa debe ser texto'),
  vehicle_engine: zOptionalNullableString('El número de motor debe ser texto'),
  vehicle_chassis: zOptionalNullableString('El chasis debe ser texto'),
  vehicle_mileage: zOptionalInt('El kilometraje debe ser un número entero', { nullable: true, min: 0 }),
  cadastral_number: zOptionalNullableString('El número catastral debe ser texto'),
  real_estate_address: zOptionalNullableString('La dirección debe ser texto'),
  real_estate_area_m2: zOptionalNullableString('El área debe ser texto numérico'),
  real_estate_location_geo: zOptionalNullableString('La ubicación geográfica debe ser texto'),
  property_material: zOptionalNullableString('El material debe ser texto'),
  property_dimensions: zOptionalNullableString('Las dimensiones deben ser texto'),
  ip: zOptionalIP('El campo ip debe ser una dirección IP válida', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_status: zRequiredInt('El campo id_status debe ser un número entero'),
  id_condition: zOptionalInt('El campo id_condition debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  transferdate: zOptionalDate('El campo transferdate debe ser una fecha válida', {
    nullable: true,
    allowEmptyString: true,
  }),
});

const updateInventoryBodySchema = z.object({
  tag: zOptionalNonEmptyField('El campo tag no puede estar vacío'),
  description: zOptionalNonEmptyField('El campo description no puede estar vacío'),
  id_ubication: zOptionalInt('El campo id_ubication debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_department: zOptionalInt('El campo id_department debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  user: zOptionalNullableString('El campo user debe ser texto'),
  classification_rule_id: zOptionalInt('La clasificación seleccionada no es válida', {
    nullable: true,
    min: 1,
  }),
  vehicle_catalog_id: zOptionalInt('La configuración del vehículo no es válida', { nullable: true, allowEmptyString: true, min: 1 }),
  vehicle_make: zOptionalNullableString('La marca del vehículo debe ser texto'),
  vehicle_model: zOptionalNullableString('El modelo del vehículo debe ser texto'),
  vehicle_model_year: zOptionalInt('El año del modelo debe ser un número entero', { nullable: true, allowEmptyString: true, min: 1886, max: 2200 }),
  vehicle_plate: zOptionalNullableString('La placa debe ser texto'),
  vehicle_engine: zOptionalNullableString('El número de motor debe ser texto'),
  vehicle_chassis: zOptionalNullableString('El chasis debe ser texto'),
  vehicle_mileage: zOptionalInt('El kilometraje debe ser un número entero', { nullable: true, allowEmptyString: true, min: 0 }),
  cadastral_number: zOptionalNullableString('El número catastral debe ser texto'),
  real_estate_address: zOptionalNullableString('La dirección debe ser texto'),
  real_estate_area_m2: zOptionalNullableString('El área debe ser texto numérico'),
  real_estate_location_geo: zOptionalNullableString('La ubicación geográfica debe ser texto'),
  property_material: zOptionalNullableString('El material debe ser texto'),
  property_dimensions: zOptionalNullableString('Las dimensiones deben ser texto'),
  id_device: zOptionalInt('El campo id_device debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_brand: zOptionalInt('El campo id_brand debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_model: zOptionalInt('El campo id_model debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  serie: zOptionalNullableString('El campo serie debe ser texto'),
  ip: zOptionalIP('El campo ip debe ser una dirección IP válida', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_status: zOptionalInt('El campo id_status debe ser un número entero'),
  id_condition: zOptionalInt('El campo id_condition debe ser un número entero', {
    nullable: true,
    allowEmptyString: true,
  }),
  id_administrative_area: zOptionalInt(
    'El campo id_administrative_area debe ser un número entero',
    { nullable: true, allowEmptyString: true }
  ),
  transferdate: zOptionalDate('El campo transferdate debe ser una fecha válida', {
    nullable: true,
    allowEmptyString: true,
  }),
});

const validateCreateInventory = validateZod({ body: createInventoryBodySchema });

const validateUpdateInventory = validateZod({
  params: inventoryIdParamsSchema,
  body: updateInventoryBodySchema,
});

export {
  createInventoryBodySchema,
  updateInventoryBodySchema,
  validateCreateInventory,
  validateUpdateInventory,
};
