-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TonerMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TonerColor" AS ENUM ('BLACK', 'CYAN', 'MAGENTA', 'YELLOW');

-- CreateEnum
CREATE TYPE "TonerDocumentStatus" AS ENUM ('PENDING', 'SIGNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "bd_carnet" (
    "id" SERIAL NOT NULL,
    "n_pos" INTEGER NOT NULL,
    "nombrecompleto" VARCHAR(50),
    "cedula" VARCHAR(50),
    "departamento" VARCHAR(50),
    "cargo" VARCHAR(50),
    "tiposangre" VARCHAR(6),
    "sexo" VARCHAR(7),
    "alergico" VARCHAR(255),
    "afecciones" VARCHAR(255),
    "emergencia" VARCHAR(255),
    "estatus" VARCHAR(50),
    "fechaentrega" DATE,

    CONSTRAINT "pk_bd_carnet" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bd_incidents" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "reporter_name" VARCHAR(35) NOT NULL,
    "email" VARCHAR(50),
    "id_ubication" INTEGER NOT NULL,
    "id_department" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "id_category" INTEGER NOT NULL,
    "other_category_detail" VARCHAR(50),
    "creation_date" TIMESTAMP(3) NOT NULL,
    "id_status" INTEGER NOT NULL,
    "id_technician" INTEGER,
    "solution_date" TIMESTAMP(3),
    "solution" VARCHAR(255) NOT NULL,
    "client_ip" VARCHAR(50),
    "ticket_number" SERIAL,

    CONSTRAINT "pk_incidents" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bd_inventory" (
    "id" SERIAL NOT NULL,
    "tag" VARCHAR(50) NOT NULL,
    "id_ubication" INTEGER NOT NULL,
    "id_department" INTEGER NOT NULL,
    "user" VARCHAR(50),
    "id_device" INTEGER NOT NULL,
    "id_brand" INTEGER NOT NULL,
    "id_model" INTEGER NOT NULL,
    "serie" VARCHAR(50) NOT NULL,
    "ip" VARCHAR(50),
    "id_status" INTEGER NOT NULL,
    "transferdate" DATE,
    "observation" VARCHAR(255),
    "created_by" INTEGER,
    "created_at" TIMETZ(6),
    "updated_at" TIMETZ(6),
    "updated_by" INTEGER,

    CONSTRAINT "pk_bd_inventory" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "pk_brands" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "pk_category" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "id_ubication" INTEGER,

    CONSTRAINT "pk_department" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "pk_device" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "id_brand" INTEGER NOT NULL,
    "id_device" INTEGER NOT NULL,

    CONSTRAINT "pk_models" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "pk_roles" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "pk_status" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubications" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "pk_ubication" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(50) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255),
    "email" VARCHAR(50),
    "id_rol" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "id_department" INTEGER,
    "id_ubication" INTEGER,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pk_users" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toners" (
    "id" SERIAL NOT NULL,
    "color" "TonerColor" NOT NULL,
    "toner_model" VARCHAR(20),
    "id_printer_model" INTEGER,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_toners" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toner_movements" (
    "id" SERIAL NOT NULL,
    "id_toner" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "movement_type" "TonerMovementType" NOT NULL,
    "id_user" INTEGER,
    "id_department" INTEGER,
    "id_ubication" INTEGER,
    "reference" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "id_incident" INTEGER,
    "new_stock" INTEGER NOT NULL,
    "previous_stock" INTEGER NOT NULL,
    "document_status" "TonerDocumentStatus" DEFAULT 'PENDING',
    "document_uploaded_at" TIMESTAMPTZ(6),
    "document_uploaded_by" INTEGER,
    "receiver_name" VARCHAR(100),
    "signed_document" VARCHAR(255),

    CONSTRAINT "toner_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toner_stock" (
    "id" SERIAL NOT NULL,
    "id_toner" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toner_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" INTEGER,
    "action" "ActivityAction" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" INTEGER,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(255),
    "source" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bd_incidents_ticket_unique" ON "bd_incidents"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "name_devices_unique" ON "devices"("name");

-- CreateIndex
CREATE UNIQUE INDEX "name_rol_unico" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "name_ubications_unique" ON "ubications"("name");

-- CreateIndex
CREATE UNIQUE INDEX "name_users_unique" ON "users"("nombre_completo", "username", "email");

-- CreateIndex
CREATE INDEX "toner_movements_id_toner_idx" ON "toner_movements"("id_toner");

-- CreateIndex
CREATE INDEX "toner_movements_id_department_idx" ON "toner_movements"("id_department");

-- CreateIndex
CREATE INDEX "toner_movements_id_ubication_idx" ON "toner_movements"("id_ubication");

-- CreateIndex
CREATE UNIQUE INDEX "toner_stock_id_toner_key" ON "toner_stock"("id_toner");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- AddForeignKey
ALTER TABLE "bd_incidents" ADD CONSTRAINT "fk_bd_incidents_categories" FOREIGN KEY ("id_category") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_incidents" ADD CONSTRAINT "fk_bd_incidents_departments" FOREIGN KEY ("id_department") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_incidents" ADD CONSTRAINT "fk_bd_incidents_status" FOREIGN KEY ("id_status") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_incidents" ADD CONSTRAINT "fk_bd_incidents_ubications" FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_incidents" ADD CONSTRAINT "fk_bd_incidents_users" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_incidents" ADD CONSTRAINT "fk_bd_incidents_users1" FOREIGN KEY ("id_technician") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_inventory" ADD CONSTRAINT "fk_bd_inventory_brands" FOREIGN KEY ("id_brand") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_inventory" ADD CONSTRAINT "fk_bd_inventory_departments" FOREIGN KEY ("id_department") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_inventory" ADD CONSTRAINT "fk_bd_inventory_devices" FOREIGN KEY ("id_device") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_inventory" ADD CONSTRAINT "fk_bd_inventory_models" FOREIGN KEY ("id_model") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_inventory" ADD CONSTRAINT "fk_bd_inventory_status" FOREIGN KEY ("id_status") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_inventory" ADD CONSTRAINT "fk_bd_inventory_ubications" FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_ubications" FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "fk_models_brands" FOREIGN KEY ("id_brand") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "fk_models_devices" FOREIGN KEY ("id_device") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_departments" FOREIGN KEY ("id_department") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_roles" FOREIGN KEY ("id_rol") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_ubications" FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toners" ADD CONSTRAINT "toners_id_printer_model_fkey" FOREIGN KEY ("id_printer_model") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "toner_movements" ADD CONSTRAINT "toner_movements_id_department_fkey" FOREIGN KEY ("id_department") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toner_movements" ADD CONSTRAINT "toner_movements_id_incident_fkey" FOREIGN KEY ("id_incident") REFERENCES "bd_incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toner_movements" ADD CONSTRAINT "toner_movements_id_toner_fkey" FOREIGN KEY ("id_toner") REFERENCES "toners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toner_movements" ADD CONSTRAINT "toner_movements_id_ubication_fkey" FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toner_movements" ADD CONSTRAINT "toner_movements_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "toner_stock" ADD CONSTRAINT "toner_stock_id_toner_fkey" FOREIGN KEY ("id_toner") REFERENCES "toners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

