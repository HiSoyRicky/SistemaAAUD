-- CreateTable
CREATE TABLE "inventory_devices" (
    "id" SERIAL NOT NULL,
    "id_inventory" INTEGER NOT NULL,
    "id_device" INTEGER NOT NULL,
    "id_brand" INTEGER NOT NULL,
    "id_model" INTEGER NOT NULL,
    "ip" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_devices_id_inventory_key" ON "inventory_devices"("id_inventory");

-- CreateIndex
CREATE INDEX "inventory_devices_id_device_idx" ON "inventory_devices"("id_device");

-- CreateIndex
CREATE INDEX "inventory_devices_id_brand_idx" ON "inventory_devices"("id_brand");

-- CreateIndex
CREATE INDEX "inventory_devices_id_model_idx" ON "inventory_devices"("id_model");

-- AddForeignKey
ALTER TABLE "inventory_devices" ADD CONSTRAINT "inventory_devices_id_inventory_fkey" FOREIGN KEY ("id_inventory") REFERENCES "bd_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_devices" ADD CONSTRAINT "inventory_devices_id_device_fkey" FOREIGN KEY ("id_device") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_devices" ADD CONSTRAINT "inventory_devices_id_brand_fkey" FOREIGN KEY ("id_brand") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_devices" ADD CONSTRAINT "inventory_devices_id_model_fkey" FOREIGN KEY ("id_model") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
