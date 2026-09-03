-- AlterTable
ALTER TABLE "inventory_asset_classification_rules" ADD COLUMN     "administrative_area_id" INTEGER;

-- AddForeignKey
ALTER TABLE "inventory_asset_classification_rules" ADD CONSTRAINT "inventory_asset_classification_rules_administrative_area_i_fkey" FOREIGN KEY ("administrative_area_id") REFERENCES "inventory_administrative_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
