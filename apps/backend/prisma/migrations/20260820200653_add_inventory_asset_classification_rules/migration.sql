-- AlterTable
ALTER TABLE "bd_inventory" ADD COLUMN     "asset_classification_rule_id" INTEGER;

-- CreateTable
CREATE TABLE "inventory_asset_types" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_asset_extensions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_asset_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_asset_classifications" (
    "id" SERIAL NOT NULL,
    "code_new" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "parent_id" INTEGER,
    "level" INTEGER NOT NULL,
    "is_assignable" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" VARCHAR(100) NOT NULL,
    "source_version" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_asset_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_asset_classification_mappings" (
    "id" SERIAL NOT NULL,
    "classification_id" INTEGER NOT NULL,
    "legacy_code" VARCHAR(20) NOT NULL,
    "legacy_description" VARCHAR(255),
    "source" VARCHAR(100) NOT NULL,
    "source_version" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_asset_classification_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_asset_classification_rules" (
    "id" SERIAL NOT NULL,
    "classification_id" INTEGER NOT NULL,
    "asset_type_id" INTEGER NOT NULL,
    "extension_id" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_asset_classification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_asset_types_code_key" ON "inventory_asset_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_asset_extensions_code_key" ON "inventory_asset_extensions"("code");

-- CreateIndex
CREATE INDEX "inventory_asset_classifications_parent_id_idx" ON "inventory_asset_classifications"("parent_id");

-- CreateIndex
CREATE INDEX "inventory_asset_classifications_active_is_assignable_idx" ON "inventory_asset_classifications"("active", "is_assignable");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_asset_classifications_source_source_version_code__key" ON "inventory_asset_classifications"("source", "source_version", "code_new");

-- CreateIndex
CREATE INDEX "inventory_asset_classification_mappings_legacy_code_idx" ON "inventory_asset_classification_mappings"("legacy_code");

-- CreateIndex
CREATE INDEX "inventory_asset_classification_mappings_classification_id_idx" ON "inventory_asset_classification_mappings"("classification_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_asset_classification_mappings_source_source_versi_key" ON "inventory_asset_classification_mappings"("source", "source_version", "legacy_code", "classification_id");

-- CreateIndex
CREATE INDEX "inventory_asset_classification_rules_classification_id_acti_idx" ON "inventory_asset_classification_rules"("classification_id", "active");

-- CreateIndex
CREATE INDEX "inventory_asset_classification_rules_asset_type_id_active_idx" ON "inventory_asset_classification_rules"("asset_type_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_asset_classification_rules_classification_id_asse_key" ON "inventory_asset_classification_rules"("classification_id", "asset_type_id", "extension_id");

-- AddForeignKey
ALTER TABLE "bd_inventory" ADD CONSTRAINT "fk_bd_inventory_asset_classification_rule" FOREIGN KEY ("asset_classification_rule_id") REFERENCES "inventory_asset_classification_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_classifications" ADD CONSTRAINT "inventory_asset_classifications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "inventory_asset_classifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_classification_mappings" ADD CONSTRAINT "inventory_asset_classification_mappings_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "inventory_asset_classifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_classification_rules" ADD CONSTRAINT "inventory_asset_classification_rules_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "inventory_asset_classifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_classification_rules" ADD CONSTRAINT "inventory_asset_classification_rules_asset_type_id_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "inventory_asset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_asset_classification_rules" ADD CONSTRAINT "inventory_asset_classification_rules_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "inventory_asset_extensions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
