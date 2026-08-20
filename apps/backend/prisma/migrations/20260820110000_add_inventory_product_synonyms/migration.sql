-- Create product synonyms without changing existing catalog or inventory tables.

CREATE TABLE "inventory_product_synonyms" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "synonym" VARCHAR(255) NOT NULL,
    "synonym_normalized" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_product_synonyms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_product_synonyms_product_id_idx"
  ON "inventory_product_synonyms"("product_id");

CREATE INDEX "inventory_product_synonyms_synonym_normalized_idx"
  ON "inventory_product_synonyms"("synonym_normalized");

CREATE UNIQUE INDEX "inventory_product_synonyms_product_id_synonym_normalized_key"
  ON "inventory_product_synonyms"("product_id", "synonym_normalized");

ALTER TABLE "inventory_product_synonyms"
  ADD CONSTRAINT "inventory_product_synonyms_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "inventory_product_catalog"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;