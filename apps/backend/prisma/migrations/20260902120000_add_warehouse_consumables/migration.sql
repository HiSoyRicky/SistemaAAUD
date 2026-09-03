-- CreateEnum
CREATE TYPE "WarehouseMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "warehouse_items" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50),
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "unit" VARCHAR(30) NOT NULL,
    "category" VARCHAR(80),
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warehouse_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_stock" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "ubication_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warehouse_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_movements" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "movement_type" "WarehouseMovementType" NOT NULL,
    "previous_stock" INTEGER NOT NULL,
    "new_stock" INTEGER NOT NULL,
    "ubication_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "receiver_name" VARCHAR(100),
    "vehicle_target" VARCHAR(100),
    "reference" VARCHAR(120),
    "observation" VARCHAR(255),
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_items_code_key" ON "warehouse_items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_items_name_key" ON "warehouse_items"("name");

-- CreateIndex
CREATE INDEX "warehouse_items_active_idx" ON "warehouse_items"("active");

-- CreateIndex
CREATE INDEX "warehouse_items_category_idx" ON "warehouse_items"("category");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stock_item_id_ubication_id_key" ON "warehouse_stock"("item_id", "ubication_id");

-- CreateIndex
CREATE INDEX "warehouse_stock_ubication_id_idx" ON "warehouse_stock"("ubication_id");

-- CreateIndex
CREATE INDEX "warehouse_movements_item_id_idx" ON "warehouse_movements"("item_id");

-- CreateIndex
CREATE INDEX "warehouse_movements_movement_type_idx" ON "warehouse_movements"("movement_type");

-- CreateIndex
CREATE INDEX "warehouse_movements_created_at_idx" ON "warehouse_movements"("created_at");

-- CreateIndex
CREATE INDEX "warehouse_movements_ubication_id_idx" ON "warehouse_movements"("ubication_id");

-- CreateIndex
CREATE INDEX "warehouse_movements_department_id_idx" ON "warehouse_movements"("department_id");

-- AddForeignKey
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "warehouse_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_ubication_id_fkey" FOREIGN KEY ("ubication_id") REFERENCES "ubications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "warehouse_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_ubication_id_fkey" FOREIGN KEY ("ubication_id") REFERENCES "ubications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
