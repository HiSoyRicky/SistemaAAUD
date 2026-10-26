CREATE TYPE "CreationRequestType" AS ENUM ('INVENTORY', 'BRAND', 'MODEL', 'DEVICE');
CREATE TYPE "CreationRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED');

CREATE TABLE "creation_requests" (
    "id" SERIAL NOT NULL,
    "type" "CreationRequestType" NOT NULL,
    "status" "CreationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER,
    "review_notes" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    CONSTRAINT "creation_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "creation_requests_status_requested_at_idx" ON "creation_requests"("status", "requested_at");
CREATE INDEX "creation_requests_requester_id_status_idx" ON "creation_requests"("requester_id", "status");

ALTER TABLE "creation_requests" ADD CONSTRAINT "creation_requests_requester_id_fkey"
  FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "creation_requests" ADD CONSTRAINT "creation_requests_reviewer_id_fkey"
  FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
