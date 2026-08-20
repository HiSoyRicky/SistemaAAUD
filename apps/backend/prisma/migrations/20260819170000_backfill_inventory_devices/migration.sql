-- Backfill data-only de inventory_devices.
-- La migración no modifica la estructura ni los datos de bd_inventory.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM bd_inventory inventory
    LEFT JOIN devices device ON device.id = inventory.id_device
    LEFT JOIN brands brand ON brand.id = inventory.id_brand
    LEFT JOIN models model ON model.id = inventory.id_model
    WHERE device.id IS NULL
       OR brand.id IS NULL
       OR model.id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Backfill abortado: existen referencias inválidas en bd_inventory';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM inventory_devices technology
    LEFT JOIN bd_inventory inventory ON inventory.id = technology.id_inventory
    LEFT JOIN devices device ON device.id = technology.id_device
    LEFT JOIN brands brand ON brand.id = technology.id_brand
    LEFT JOIN models model ON model.id = technology.id_model
    WHERE inventory.id IS NULL
       OR device.id IS NULL
       OR brand.id IS NULL
       OR model.id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Backfill abortado: existen referencias inválidas en inventory_devices';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM bd_inventory inventory
    JOIN models model ON model.id = inventory.id_model
    WHERE model.id_brand IS DISTINCT FROM inventory.id_brand
       OR model.id_device IS DISTINCT FROM inventory.id_device
  ) THEN
    RAISE EXCEPTION
      'Backfill abortado: existen inconsistencias modelo/marca/dispositivo en bd_inventory';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM inventory_devices technology
    JOIN models model ON model.id = technology.id_model
    WHERE model.id_brand IS DISTINCT FROM technology.id_brand
       OR model.id_device IS DISTINCT FROM technology.id_device
  ) THEN
    RAISE EXCEPTION
      'Backfill abortado: existen inconsistencias modelo/marca/dispositivo en inventory_devices';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM bd_inventory inventory
    JOIN inventory_devices technology
      ON technology.id_inventory = inventory.id
    WHERE inventory.id_device IS DISTINCT FROM technology.id_device
       OR inventory.id_brand IS DISTINCT FROM technology.id_brand
       OR inventory.id_model IS DISTINCT FROM technology.id_model
       OR inventory.ip IS DISTINCT FROM technology.ip
  ) THEN
    RAISE EXCEPTION
      'Backfill abortado: bd_inventory e inventory_devices contienen datos tecnológicos diferentes';
  END IF;
END
$$;

INSERT INTO inventory_devices (
  id_inventory,
  id_device,
  id_brand,
  id_model,
  ip,
  created_at,
  updated_at
)
SELECT
  inventory.id,
  inventory.id_device,
  inventory.id_brand,
  inventory.id_model,
  inventory.ip,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM bd_inventory inventory
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_devices technology
  WHERE technology.id_inventory = inventory.id
)
ON CONFLICT (id_inventory) DO NOTHING;

COMMIT;
