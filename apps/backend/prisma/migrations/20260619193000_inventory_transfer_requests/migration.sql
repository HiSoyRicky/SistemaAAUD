CREATE TYPE "InventoryTransferRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CORRECTION_REQUESTED'
);

CREATE TABLE "inventory_transfer_requests" (
  "id" SERIAL NOT NULL,
  "inventory_id" INTEGER NOT NULL,
  "requester_id" INTEGER NOT NULL,
  "approver_id" INTEGER,
  "status" "InventoryTransferRequestStatus" NOT NULL DEFAULT 'PENDING',
  "snapshot" JSONB NOT NULL,
  "review_notes" VARCHAR(255),
  "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewed_at" TIMESTAMPTZ(6),

  CONSTRAINT "inventory_transfer_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_transfer_requests_status_requested_at_idx"
  ON "inventory_transfer_requests" ("status", "requested_at");

CREATE INDEX "inventory_transfer_requests_inventory_id_idx"
  ON "inventory_transfer_requests" ("inventory_id");

ALTER TABLE "inventory_transfer_requests"
  ADD CONSTRAINT "fk_inventory_transfer_requests_inventory"
  FOREIGN KEY ("inventory_id") REFERENCES "bd_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_transfer_requests"
  ADD CONSTRAINT "fk_inventory_transfer_requests_requester"
  FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_transfer_requests"
  ADD CONSTRAINT "fk_inventory_transfer_requests_approver"
  FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;