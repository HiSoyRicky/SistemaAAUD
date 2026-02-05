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
CREATE TABLE "toners" (
    "id" SERIAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "status" VARCHAR(50),
    "last_update" DATE,
    "toner_model" VARCHAR(20),
    "color" VARCHAR(10),
    "id_printer_model" INTEGER,

    CONSTRAINT "pk_toners" PRIMARY KEY ("id")
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
    "active" INTEGER NOT NULL,
    "id_department" INTEGER,
    "id_ubication" INTEGER,

    CONSTRAINT "pk_users" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bd_documents" (
    "id" SERIAL NOT NULL,
    "id_ubication" INTEGER NOT NULL,
    "id_department" INTEGER NOT NULL,
    "id_doc_type" INTEGER NOT NULL,
    "consecutive" INTEGER NOT NULL,
    "id_origin" INTEGER,
    "sent_by" VARCHAR(150),
    "sent_to" VARCHAR(150),
    "document_date" DATE,
    "received_at" TIMESTAMP(6),
    "sent_at" TIMESTAMP(6),
    "closed_at" TIMESTAMP(6),
    "subject" VARCHAR(255),
    "description" TEXT,
    "observations" TEXT,
    "attachment" VARCHAR(255),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "bd_documents_pkey" PRIMARY KEY ("id","id_ubication","id_department","id_doc_type")
);

-- CreateTable
CREATE TABLE "doc_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(35),

    CONSTRAINT "doc_doc.type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_external_entities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150),

    CONSTRAINT "bd_external_entities_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "ux_docs_seq" ON "bd_documents"("id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_doc_extenal.entities_name" ON "doc_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_bd_external_entities_name" ON "doc_external_entities"("name");

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
ALTER TABLE "toners" ADD CONSTRAINT "toners_id_printer_model_fkey" FOREIGN KEY ("id_printer_model") REFERENCES "models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_departments" FOREIGN KEY ("id_department") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_roles" FOREIGN KEY ("id_rol") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_ubications" FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bd_documents" ADD CONSTRAINT "fk_bd_documents_departments" FOREIGN KEY ("id_department") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_documents" ADD CONSTRAINT "fk_bd_documents_doc_doc.type" FOREIGN KEY ("id_doc_type") REFERENCES "doc_type"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_documents" ADD CONSTRAINT "fk_bd_documents_external.entities" FOREIGN KEY ("id_origin") REFERENCES "doc_external_entities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_documents" ADD CONSTRAINT "fk_bd_documents_ubications" FOREIGN KEY ("id_ubication") REFERENCES "ubications"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bd_documents" ADD CONSTRAINT "fk_bd_documents_users" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

