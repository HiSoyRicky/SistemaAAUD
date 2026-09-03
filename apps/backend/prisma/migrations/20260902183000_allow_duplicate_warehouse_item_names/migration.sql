DROP INDEX IF EXISTS "warehouse_items_name_key";

CREATE INDEX "warehouse_items_name_idx" ON "warehouse_items"("name");