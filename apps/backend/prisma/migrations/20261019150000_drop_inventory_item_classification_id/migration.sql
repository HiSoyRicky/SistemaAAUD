DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "inventory_items" WHERE "classification_id" IS NOT NULL) THEN
    RAISE EXCEPTION 'inventory_items.classification_id tiene valores; no se puede eliminar sin revisión';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_classification_fkey";

-- DropIndex
DROP INDEX "inventory_items_classification_id_idx";

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "classification_id";
