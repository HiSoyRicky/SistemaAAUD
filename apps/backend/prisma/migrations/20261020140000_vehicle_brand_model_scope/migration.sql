ALTER TABLE "brands"
  ADD COLUMN "catalog_type" VARCHAR(20) NOT NULL DEFAULT 'TECHNOLOGY';

ALTER TABLE "models"
  ALTER COLUMN "id_device" DROP NOT NULL;

ALTER TABLE "brands"
  ADD CONSTRAINT "brands_catalog_type_check"
  CHECK ("catalog_type" IN ('TECHNOLOGY', 'VEHICLE'));

ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "brands_name_key";
DROP INDEX IF EXISTS "brands_name_key";
CREATE UNIQUE INDEX "brands_name_catalog_type_key"
  ON "brands"("name", "catalog_type");
