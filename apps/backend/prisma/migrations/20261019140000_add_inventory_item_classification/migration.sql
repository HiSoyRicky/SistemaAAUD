-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN "classification_id" INTEGER;

-- CreateIndex
CREATE INDEX "inventory_items_classification_id_idx" ON "inventory_items"("classification_id");

-- CreateIndex
CREATE INDEX "inventory_items_asset_type_id_idx" ON "inventory_items"("asset_type_id");

-- CreateIndex
CREATE INDEX "inventory_items_extension_id_idx" ON "inventory_items"("extension_id");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_classification_fkey" FOREIGN KEY ("classification_id") REFERENCES "inventory_asset_classifications"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_asset_type_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "inventory_asset_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_extension_fkey" FOREIGN KEY ("extension_id") REFERENCES "inventory_asset_extensions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
