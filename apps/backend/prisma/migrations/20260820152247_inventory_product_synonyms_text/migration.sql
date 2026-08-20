-- DropIndex
DROP INDEX "bd_inventory_id_administrative_area_idx";

-- DropIndex
DROP INDEX "bd_inventory_id_condition_idx";

-- AlterTable
ALTER TABLE "inventory_product_synonyms" ALTER COLUMN "synonym" SET DATA TYPE TEXT,
ALTER COLUMN "synonym_normalized" SET DATA TYPE TEXT;
