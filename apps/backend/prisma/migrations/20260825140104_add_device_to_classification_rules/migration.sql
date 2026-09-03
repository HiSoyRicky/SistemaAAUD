-- DropIndex
DROP INDEX "inventory_asset_classification_rules_classification_id_asse_key";

-- AlterTable
ALTER TABLE "inventory_asset_classification_rules" ADD COLUMN     "device_id" INTEGER;

-- Device-specific rules are selected by device scope, not as generic defaults.
ALTER TABLE "inventory_asset_classification_rules"
ADD CONSTRAINT "inventory_asset_classification_rules_device_default_check"
CHECK ("device_id" IS NULL OR "is_default" = false);

-- CreateIndex
CREATE INDEX "inventory_asset_classification_rules_device_id_active_idx" ON "inventory_asset_classification_rules"("device_id", "active");

-- CreateIndex
CREATE INDEX "inventory_asset_classification_rules_asset_type_id_extensio_idx" ON "inventory_asset_classification_rules"("asset_type_id", "extension_id", "administrative_area_id", "active");

-- CreateIndex
CREATE INDEX "inventory_asset_classification_rules_administrative_area_id_idx" ON "inventory_asset_classification_rules"("administrative_area_id", "active");

-- A device can have at most one active rule per administrative area.
CREATE UNIQUE INDEX "inventory_asset_classification_rules_active_device_area_uq"
ON "inventory_asset_classification_rules" ("device_id", COALESCE("administrative_area_id", 0))
WHERE "device_id" IS NOT NULL AND "active" = true;

-- Preserve one default per generic scope when legacy data contains several defaults.
WITH ranked_defaults AS (
	SELECT
		"id",
		ROW_NUMBER() OVER (
			PARTITION BY "asset_type_id", COALESCE("extension_id", 0), COALESCE("administrative_area_id", 0)
			ORDER BY "id"
		) AS row_number
	FROM "inventory_asset_classification_rules"
	WHERE "device_id" IS NULL AND "active" = true AND "is_default" = true
)
UPDATE "inventory_asset_classification_rules" AS rules
SET "is_default" = false
FROM ranked_defaults
WHERE rules."id" = ranked_defaults."id" AND ranked_defaults.row_number > 1;

-- A generic scope can have at most one active default rule.
CREATE UNIQUE INDEX "inventory_asset_classification_rules_active_generic_default_uq"
ON "inventory_asset_classification_rules" (
	"asset_type_id",
	COALESCE("extension_id", 0),
	COALESCE("administrative_area_id", 0)
)
WHERE "device_id" IS NULL AND "active" = true AND "is_default" = true;

-- The same active rule scope and classification cannot be duplicated.
CREATE UNIQUE INDEX "inventory_asset_classification_rules_active_exact_scope_uq"
ON "inventory_asset_classification_rules" (
	"classification_id",
	"asset_type_id",
	COALESCE("extension_id", 0),
	COALESCE("device_id", 0),
	COALESCE("administrative_area_id", 0)
)
WHERE "active" = true;

-- AddForeignKey
ALTER TABLE "inventory_asset_classification_rules" ADD CONSTRAINT "inventory_asset_classification_rules_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
