ALTER TABLE "warehouse_movements"
ADD COLUMN "idempotency_key" VARCHAR(100);

CREATE UNIQUE INDEX "warehouse_movements_idempotency_key_key"
ON "warehouse_movements" ("idempotency_key");