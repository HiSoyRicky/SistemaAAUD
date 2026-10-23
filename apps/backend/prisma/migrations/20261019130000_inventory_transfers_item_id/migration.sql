-- Traslados sobre inventory_items: cada solicitud apunta al bien centralizado.
-- El backfill usa legacy_inventory_map (correspondencia verificada 1:1 en la Fase I).
-- inventory_id queda como columna legacy opcional; ya no se escribe.

ALTER TABLE "inventory_transfer_requests" ADD COLUMN "item_id" INTEGER;

UPDATE "inventory_transfer_requests" t
SET "item_id" = m."item_id"
FROM "legacy_inventory_map" m
WHERE m."bd_inventory_id" = t."inventory_id";

DO $$
DECLARE
  v_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing
  FROM "inventory_transfer_requests"
  WHERE "item_id" IS NULL;

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Backfill de traslados incompleto: % solicitudes sin bien equivalente', v_missing;
  END IF;
END
$$;

ALTER TABLE "inventory_transfer_requests"
  ALTER COLUMN "item_id" SET NOT NULL,
  ALTER COLUMN "inventory_id" DROP NOT NULL;

ALTER TABLE "inventory_transfer_requests"
  ADD CONSTRAINT "fk_inventory_transfer_requests_item"
  FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX "inventory_transfer_requests_item_id_status_idx"
  ON "inventory_transfer_requests"("item_id", "status");
