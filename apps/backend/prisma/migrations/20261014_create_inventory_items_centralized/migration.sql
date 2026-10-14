-- CENTRALIZACIÓN DE INVENTARIO - Fase I (2026-10-14)
-- Crear tabla central inventory_items con extensiones especializadas
-- Esta migración copia datos de bd_inventory -> inventory_items de forma aditiva sin destruir legacy

-- Paso 1a: Crear tabla central inventory_items
CREATE TABLE "inventory_items" (
    "id" SERIAL NOT NULL,
    "tag" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "id_ubication" INTEGER,
    "id_department" INTEGER,
    "user" VARCHAR(50),
    "id_status" INTEGER NOT NULL,
    "id_condition" INTEGER,
    "id_administrative_area" INTEGER,
    "asset_type_id" INTEGER,
    "extension_id" INTEGER,
    "asset_classification_rule_id" INTEGER,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" INTEGER,
    "transferdate" DATE,
    "observation" VARCHAR(255),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_items_status_fkey" FOREIGN KEY ("id_status") REFERENCES "status"("id") ON DELETE RESTRICT
);

-- Índices críticos ANTES de otros FK
CREATE INDEX "inventory_items_tag_idx" ON "inventory_items"("tag");
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("id_status");
CREATE INDEX "inventory_items_admin_area_idx" ON "inventory_items"("id_administrative_area");
CREATE INDEX "inventory_items_ubication_idx" ON "inventory_items"("id_ubication");
CREATE INDEX "inventory_items_department_idx" ON "inventory_items"("id_department");

-- Paso 1b: Crear tabla inventory_item_devices (extensión 1:1 para equipos IT)
CREATE TABLE "inventory_item_devices" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL UNIQUE,
    "id_device" INTEGER NOT NULL,
    "id_brand" INTEGER NOT NULL,
    "id_model" INTEGER NOT NULL,
    "serie" VARCHAR(50) NOT NULL,
    "ip" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_item_devices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_item_devices_item_id_fkey"
        FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE,
    CONSTRAINT "inventory_item_devices_device_fkey"
        FOREIGN KEY ("id_device") REFERENCES "devices"("id") ON DELETE RESTRICT,
    CONSTRAINT "inventory_item_devices_brand_fkey"
        FOREIGN KEY ("id_brand") REFERENCES "brands"("id") ON DELETE RESTRICT,
    CONSTRAINT "inventory_item_devices_model_fkey"
        FOREIGN KEY ("id_model") REFERENCES "models"("id") ON DELETE RESTRICT
);

CREATE INDEX "inventory_item_devices_device_idx" ON "inventory_item_devices"("id_device");
CREATE INDEX "inventory_item_devices_brand_idx" ON "inventory_item_devices"("id_brand");
CREATE INDEX "inventory_item_devices_model_idx" ON "inventory_item_devices"("id_model");

-- Paso 1c: Crear tabla inventory_item_vehicles (extensión 1:1 - ready para Fase II)
CREATE TABLE "inventory_item_vehicles" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL UNIQUE,
    "plate" VARCHAR(20),
    "chassis" VARCHAR(50),
    "engine" VARCHAR(50),
    "vehicle_type" VARCHAR(50),
    "fuel_type" VARCHAR(30),
    "mileage" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_item_vehicles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_item_vehicles_item_id_fkey"
        FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);

CREATE INDEX "inventory_item_vehicles_plate_idx" ON "inventory_item_vehicles"("plate");

-- Paso 1d: Crear tabla inventory_item_properties (extensión 1:1 - ready para Fase II)
CREATE TABLE "inventory_item_properties" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL UNIQUE,
    "material" VARCHAR(100),
    "dimensions" VARCHAR(150),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_item_properties_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_item_properties_item_id_fkey"
        FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);

-- Paso 1e: Crear tabla inventory_item_real_estate (extensión 1:1 - ready para Fase II)
CREATE TABLE "inventory_item_real_estate" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL UNIQUE,
    "address" VARCHAR(255),
    "area_m2" NUMERIC(10, 2),
    "location_geo" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_item_real_estate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_item_real_estate_item_id_fkey"
        FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);

-- Paso 2: Validación pre-backfill - Comprobar integridad de bd_inventory antes de copiar
DO $$
BEGIN
  -- Verificar que NO hay bd_inventory con id_device inválido
  IF EXISTS (
    SELECT 1 FROM "bd_inventory" bdi
    LEFT JOIN "devices" d ON d.id = bdi.id_device
    WHERE d.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Backfill abortado: bd_inventory contiene id_device inválido';
  END IF;

  -- Verificar que NO hay bd_inventory con id_brand inválido
  IF EXISTS (
    SELECT 1 FROM "bd_inventory" bdi
    LEFT JOIN "brands" b ON b.id = bdi.id_brand
    WHERE b.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Backfill abortado: bd_inventory contiene id_brand inválido';
  END IF;

  -- Verificar que NO hay bd_inventory con id_model inválido
  IF EXISTS (
    SELECT 1 FROM "bd_inventory" bdi
    LEFT JOIN "models" m ON m.id = bdi.id_model
    WHERE m.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Backfill abortado: bd_inventory contiene id_model inválido';
  END IF;

  -- Log de pre-migration
  RAISE NOTICE 'Pre-migration: % registros en bd_inventory',
    (SELECT COUNT(*) FROM "bd_inventory");
  RAISE NOTICE 'Pre-migration: % registros en inventory_devices',
    (SELECT COUNT(*) FROM "inventory_devices");
END
$$;

-- Paso 3a: Copiar bd_inventory -> inventory_items
INSERT INTO "inventory_items" (
  "tag", "description", "id_ubication", "id_department", "user",
  "id_status", "id_condition", "id_administrative_area",
  "asset_type_id", "extension_id", "asset_classification_rule_id",
  "created_by", "created_at", "updated_at", "updated_by",
  "transferdate", "observation"
)
SELECT
  bdi.tag, bdi.description, bdi.id_ubication, bdi.id_department, bdi.user,
  bdi.id_status, bdi.id_condition, bdi.id_administrative_area,
  NULL::INTEGER, NULL::INTEGER, bdi.asset_classification_rule_id,
  bdi.created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, bdi.updated_by,
  bdi.transferdate, bdi.observation
FROM "bd_inventory" bdi
ORDER BY bdi.id ASC;

-- Paso 3b: Copiar inventory_devices -> inventory_item_devices
INSERT INTO "inventory_item_devices" (
  "item_id", "id_device", "id_brand", "id_model", "serie", "ip", "created_at", "updated_at"
)
SELECT
  ii.id,
  id_dev.id_device,
  id_dev.id_brand,
  id_dev.id_model,
  bdi.serie,
  id_dev.ip,
  id_dev.created_at,
  id_dev.updated_at
FROM "inventory_devices" id_dev
INNER JOIN "bd_inventory" bdi ON id_dev.id_inventory = bdi.id
INNER JOIN "inventory_items" ii ON ii.tag = bdi.tag
WHERE NOT EXISTS (
  SELECT 1 FROM "inventory_item_devices" iid WHERE iid.item_id = ii.id
)
ON CONFLICT ("item_id") DO NOTHING;

-- Paso 4: Validación post-migration
DO $$
DECLARE
  v_inventory_count INTEGER;
  v_devices_count INTEGER;
  v_orphaned_count INTEGER;
  v_bd_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bd_count FROM "bd_inventory";
  SELECT COUNT(*) INTO v_inventory_count FROM "inventory_items";
  SELECT COUNT(*) INTO v_devices_count FROM "inventory_item_devices";
  SELECT COUNT(*) INTO v_orphaned_count FROM "inventory_items" ii
    LEFT JOIN "inventory_item_devices" iid ON ii.id = iid.item_id
    WHERE iid.id IS NULL;

  RAISE NOTICE 'Post-migration: % registros en bd_inventory (original)',
    v_bd_count;
  RAISE NOTICE 'Post-migration: % registros en inventory_items (nuevo)',
    v_inventory_count;
  RAISE NOTICE 'Post-migration: % registros en inventory_item_devices',
    v_devices_count;
  RAISE NOTICE 'Post-migration: % items SIN devices (esperado: % de bd_inventory)',
    v_orphaned_count, v_bd_count - v_devices_count;

  IF v_inventory_count != v_bd_count THEN
    RAISE WARNING 'MISMATCH: inventory_items (%) != bd_inventory (%)',
      v_inventory_count, v_bd_count;
  ELSE
    RAISE NOTICE 'OK: inventory_items count matches bd_inventory count ✓';
  END IF;
END
$$;

-- Paso 5: Agregar remaining FK constraints
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_ubication_fkey"
  FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE RESTRICT;

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_department_fkey"
  FOREIGN KEY ("id_department") REFERENCES "departments"("id") ON DELETE RESTRICT;

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_condition_fkey"
  FOREIGN KEY ("id_condition") REFERENCES "inventory_conditions"("id") ON DELETE RESTRICT;

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_administrative_area_fkey"
  FOREIGN KEY ("id_administrative_area") REFERENCES "inventory_administrative_areas"("id") ON DELETE RESTRICT;

ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_asset_classification_rule_fkey"
  FOREIGN KEY ("asset_classification_rule_id") REFERENCES "inventory_asset_classification_rules"("id") ON DELETE RESTRICT;
