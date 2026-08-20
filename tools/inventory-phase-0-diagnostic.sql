-- Fase 0: diagnóstico de inventario.
-- Solo lectura. No contiene INSERT, UPDATE, DELETE, TRUNCATE ni DDL.

SELECT 'bd_inventory_count' AS diagnostic, COUNT(*) AS total
FROM bd_inventory;

SELECT 'inventory_devices_count' AS diagnostic, COUNT(*) AS total
FROM inventory_devices;

SELECT
  'technology_assets_without_inventory_devices' AS diagnostic,
  COUNT(*) AS total
FROM bd_inventory inventory
LEFT JOIN inventory_devices technology
  ON technology.id_inventory = inventory.id
WHERE technology.id IS NULL;

SELECT
  'bd_inventory_invalid_references' AS diagnostic,
  COUNT(*) AS total
FROM bd_inventory inventory
LEFT JOIN devices device ON device.id = inventory.id_device
LEFT JOIN brands brand ON brand.id = inventory.id_brand
LEFT JOIN models model ON model.id = inventory.id_model
LEFT JOIN status asset_status ON asset_status.id = inventory.id_status
WHERE device.id IS NULL
   OR brand.id IS NULL
   OR model.id IS NULL
   OR asset_status.id IS NULL;

SELECT
  'inventory_devices_invalid_references' AS diagnostic,
  COUNT(*) AS total
FROM inventory_devices technology
LEFT JOIN bd_inventory inventory ON inventory.id = technology.id_inventory
LEFT JOIN devices device ON device.id = technology.id_device
LEFT JOIN brands brand ON brand.id = technology.id_brand
LEFT JOIN models model ON model.id = technology.id_model
WHERE inventory.id IS NULL
   OR device.id IS NULL
   OR brand.id IS NULL
   OR model.id IS NULL;

SELECT
  'bd_inventory_model_brand_device_inconsistencies' AS diagnostic,
  COUNT(*) AS total
FROM bd_inventory inventory
JOIN models model ON model.id = inventory.id_model
WHERE model.id_brand IS DISTINCT FROM inventory.id_brand
   OR model.id_device IS DISTINCT FROM inventory.id_device;

SELECT
  'inventory_devices_model_brand_device_inconsistencies' AS diagnostic,
  COUNT(*) AS total
FROM inventory_devices technology
JOIN models model ON model.id = technology.id_model
WHERE model.id_brand IS DISTINCT FROM technology.id_brand
   OR model.id_device IS DISTINCT FROM technology.id_device;

SELECT tag, COUNT(*) AS total
FROM bd_inventory
GROUP BY tag
HAVING COUNT(*) > 1
ORDER BY total DESC, tag;

SELECT serie, COUNT(*) AS total
FROM bd_inventory
GROUP BY serie
HAVING COUNT(*) > 1
ORDER BY total DESC, serie;

SELECT
  'series_ss' AS diagnostic,
  COUNT(*) AS total
FROM bd_inventory
WHERE UPPER(BTRIM(serie)) = 'S/S';

SELECT
  'legacy_fallback_candidates' AS diagnostic,
  COUNT(*) AS total
FROM bd_inventory inventory
LEFT JOIN inventory_devices technology
  ON technology.id_inventory = inventory.id
WHERE technology.id IS NULL;

SELECT
  'legacy_fallback_candidate_detail' AS diagnostic,
  inventory.id AS inventory_id,
  inventory.tag,
  inventory.serie,
  inventory.id_device,
  inventory.id_brand,
  inventory.id_model,
  inventory.ip
FROM bd_inventory inventory
LEFT JOIN inventory_devices technology
  ON technology.id_inventory = inventory.id
WHERE technology.id IS NULL
ORDER BY inventory.id;

SELECT
  'existing_inventory_devices_mismatch_detail' AS diagnostic,
  inventory.id AS inventory_id,
  inventory.tag,
  technology.id AS inventory_device_id,
  inventory.id_device AS legacy_id_device,
  technology.id_device AS extension_id_device,
  inventory.id_brand AS legacy_id_brand,
  technology.id_brand AS extension_id_brand,
  inventory.id_model AS legacy_id_model,
  technology.id_model AS extension_id_model,
  inventory.ip AS legacy_ip,
  technology.ip AS extension_ip
FROM bd_inventory inventory
JOIN inventory_devices technology
  ON technology.id_inventory = inventory.id
WHERE inventory.id_device IS DISTINCT FROM technology.id_device
   OR inventory.id_brand IS DISTINCT FROM technology.id_brand
   OR inventory.id_model IS DISTINCT FROM technology.id_model
   OR inventory.ip IS DISTINCT FROM technology.ip
ORDER BY inventory.id;
