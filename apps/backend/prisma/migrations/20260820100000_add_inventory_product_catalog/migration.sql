-- Create the official product catalog structure only.
-- Official catalog data must be loaded separately from the source file provided by MEF/Panama Compra.

CREATE TABLE "inventory_product_catalog" (
    "id" SERIAL NOT NULL,
    "codigo_producto" VARCHAR(50) NOT NULL,
    "titulo_espanol" VARCHAR(255) NOT NULL,
    "titulo_ingles" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_product_catalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_product_catalog_codigo_producto_key"
  ON "inventory_product_catalog"("codigo_producto");
