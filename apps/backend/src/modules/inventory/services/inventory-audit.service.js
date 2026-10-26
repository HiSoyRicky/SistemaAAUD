import { activityContext } from '../../../config/prisma.js';

const SNAPSHOT_FIELDS = [
  'id',
  'tag',
  'id_ubication',
  'id_department',
  'user',
  'description',
  'id_device',
  'id_brand',
  'id_model',
  'serie',
  'ip',
  'id_status',
  'id_condition',
  'id_administrative_area',
  'transferdate',
  'observation',
  'asset_classification_rule_id',
];

export function toInventoryAuditSnapshot(record) {
  if (!record) return null;

  const snapshot = Object.fromEntries(
    SNAPSHOT_FIELDS.map((field) => [field, record[field] ?? null])
  );
  const technology = record.device_details;

  if (technology) {
    snapshot.id_device = technology.id_device;
    snapshot.id_brand = technology.id_brand;
    snapshot.id_model = technology.id_model;
    snapshot.ip = technology.ip ?? null;
  }

  if (record.vehicle_details) {
    snapshot.vehicle_details = {
      make: record.vehicle_details.make ?? null,
      model: record.vehicle_details.model ?? null,
      model_year: record.vehicle_details.model_year ?? null,
      plate: record.vehicle_details.plate ?? null,
      chassis: record.vehicle_details.chassis ?? null,
      engine: record.vehicle_details.engine ?? null,
      vehicle_type: record.vehicle_details.vehicle_type ?? null,
      fuel_type: record.vehicle_details.fuel_type ?? null,
      mileage: record.vehicle_details.mileage ?? null,
    };
  }

  if (record.real_estate_details) {
    snapshot.real_estate_details = {
      cadastral_number: record.real_estate_details.cadastral_number ?? null,
      address: record.real_estate_details.address ?? null,
      area_m2: record.real_estate_details.area_m2?.toString() ?? null,
      location_geo: record.real_estate_details.location_geo ?? null,
    };
  }

  if (record.property_details) {
    snapshot.property_details = {
      material: record.property_details.material ?? null,
      dimensions: record.property_details.dimensions ?? null,
    };
  }

  if (snapshot.transferdate instanceof Date) {
    snapshot.transferdate = snapshot.transferdate.toISOString();
  }

  return snapshot;
}

export async function writeInventoryAuditEvent(
  tx,
  { action, oldRecord = null, newRecord, userId, source, metadata = {} }
) {
  const context = activityContext.getStore();

  return tx.activity_logs.create({
    data: {
      entity_type: 'BD_INVENTORY',
      entity_id: newRecord.id,
      action,
      old_values: toInventoryAuditSnapshot(oldRecord),
      new_values: { ...toInventoryAuditSnapshot(newRecord), ...metadata },
      user_id: userId ?? null,
      ip_address: context?.ipAddress ?? null,
      user_agent: context?.userAgent ?? null,
      source,
    },
  });
}

export function sameInventoryAuditState(first, second) {
  return JSON.stringify(toInventoryAuditSnapshot(first)) ===
    JSON.stringify(toInventoryAuditSnapshot(second));
}
