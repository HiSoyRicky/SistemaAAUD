-- Corrige la correspondencia legacy -> inventory_items (Fase I).
-- inventory_items.id fue asignado en el mismo orden que bd_inventory.id, así que la
-- correspondencia es por posición. Se persiste en legacy_inventory_map para que las
-- correcciones y el backfill de traslados no dependan de un recálculo posterior.

CREATE TABLE "legacy_inventory_map" (
    "bd_inventory_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,

    CONSTRAINT "legacy_inventory_map_pkey" PRIMARY KEY ("bd_inventory_id"),
    CONSTRAINT "legacy_inventory_map_item_id_key" UNIQUE ("item_id"),
    CONSTRAINT "legacy_inventory_map_bd_inventory_fkey"
        FOREIGN KEY ("bd_inventory_id") REFERENCES "bd_inventory"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "legacy_inventory_map_item_fkey"
        FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

INSERT INTO "legacy_inventory_map" ("bd_inventory_id", "item_id")
SELECT b.id, i.id
FROM (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM "bd_inventory") b
JOIN (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM "inventory_items") i USING (rn);

DO $$
DECLARE
  v_map INTEGER;
  v_bd INTEGER;
  v_items INTEGER;
  v_tag_mismatch INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_map FROM "legacy_inventory_map";
  SELECT COUNT(*) INTO v_bd FROM "bd_inventory";
  SELECT COUNT(*) INTO v_items FROM "inventory_items";

  IF v_map <> v_bd OR v_map <> v_items THEN
    RAISE EXCEPTION 'Mapeo abortado: map=% bd=% items=%', v_map, v_bd, v_items;
  END IF;

  SELECT COUNT(*) INTO v_tag_mismatch
  FROM "legacy_inventory_map" m
  JOIN "bd_inventory" b ON b.id = m.bd_inventory_id
  JOIN "inventory_items" i ON i.id = m.item_id
  WHERE b.tag IS DISTINCT FROM i.tag;

  IF v_tag_mismatch > 0 THEN
    RAISE EXCEPTION 'Mapeo abortado: % pares con tag distinto', v_tag_mismatch;
  END IF;
END
$$;

UPDATE "inventory_item_devices" d
SET "id_device" = l.id_device,
    "id_brand" = l.id_brand,
    "id_model" = l.id_model,
    "ip" = l.ip,
    "serie" = b.serie,
    "created_at" = l.created_at,
    "updated_at" = CURRENT_TIMESTAMP
FROM "legacy_inventory_map" m
JOIN "bd_inventory" b ON b.id = m.bd_inventory_id
JOIN "inventory_devices" l ON l.id_inventory = m.bd_inventory_id
WHERE d.item_id = m.item_id
  AND (d.id_device, d.id_brand, d.id_model, d.ip, d.serie, d.created_at)
      IS DISTINCT FROM (l.id_device, l.id_brand, l.id_model, l.ip, b.serie, l.created_at);

UPDATE "inventory_items" i
SET "created_at" = l.created_at,
    "updated_at" = COALESCE(l.updated_at, l.created_at)
FROM "legacy_inventory_map" m
JOIN "inventory_devices" l ON l.id_inventory = m.bd_inventory_id
WHERE i.id = m.item_id
  AND i.created_at IS DISTINCT FROM l.created_at;

DO $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM "inventory_item_devices" d
  JOIN "legacy_inventory_map" m ON m.item_id = d.item_id
  JOIN "bd_inventory" b ON b.id = m.bd_inventory_id
  JOIN "inventory_devices" l ON l.id_inventory = m.bd_inventory_id
  WHERE (d.id_device, d.id_brand, d.id_model, d.ip, d.serie, d.created_at)
        IS DISTINCT FROM (l.id_device, l.id_brand, l.id_model, l.ip, b.serie, l.created_at);

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Corrección incompleta: % equipos siguen con datos distintos', v_remaining;
  END IF;
END
$$;
