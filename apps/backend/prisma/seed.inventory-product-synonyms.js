import { Prisma, PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prisma = new PrismaClient();
const sourceFile = join(
  __dirname,
  '../../../tools/Catalogo de Activos Fijos (solo nivel productos).xlsx'
);
const BATCH_SIZE = 500;

// Resolución funcional confirmada: conservar la fila oficial de "Pipe couplings".
const duplicateResolutions = {
  40142315: 6661,
};

const REQUIRED_HEADERS = {
  code: 'CODIGO DE PRODUCTOS',
  synonyms: 'SINONIMOS DE PANAMA COMPRA',
};

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function cellText(cell) {
  if (cell.value === null || cell.value === undefined) return '';
  return String(cell.text ?? cell.value);
}

function getHeaderIndexes(worksheet) {
  const indexes = {};
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = normalizeHeader(cell.text || cell.value);

    for (const [key, expected] of Object.entries(REQUIRED_HEADERS)) {
      if (header === expected) indexes[key] = columnNumber;
    }
  });

  const missing = Object.entries(REQUIRED_HEADERS)
    .filter(([key]) => !indexes[key])
    .map(([, header]) => header);

  if (missing.length) {
    throw new Error(`Faltan columnas oficiales: ${missing.join(', ')}`);
  }

  return indexes;
}

function normalizeSynonym(value) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function readOfficialRows(worksheet) {
  const indexes = getHeaderIndexes(worksheet);
  const rows = [];
  const invalidRows = [];

  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const code = cellText(row.getCell(indexes.code)).trim();
    const synonymSource = cellText(row.getCell(indexes.synonyms));
    const rowValues = row.values.slice(1);
    const isEmpty = rowValues.every(
      (value) => value === null || value === undefined || String(value).trim() === ''
    );

    if (isEmpty) return;

    if (!code) {
      invalidRows.push({ rowNumber, reason: 'codigo_producto vacío' });
      return;
    }

    rows.push({ rowNumber, codigo_producto: code, synonymSource });
  });

  if (invalidRows.length) {
    throw new Error(`Filas inválidas: ${JSON.stringify(invalidRows)}`);
  }

  return rows;
}

function resolveDuplicateRows(rows) {
  const byCode = new Map();

  for (const row of rows) {
    if (!byCode.has(row.codigo_producto)) byCode.set(row.codigo_producto, []);
    byCode.get(row.codigo_producto).push(row);
  }

  const resolved = [];
  const conflicts = [];

  for (const [code, candidates] of byCode.entries()) {
    if (candidates.length === 1) {
      resolved.push(candidates[0]);
      continue;
    }

    const selectedRowNumber = duplicateResolutions[code];
    const selected = candidates.find((row) => row.rowNumber === selectedRowNumber);

    if (!selected) {
      conflicts.push({ code, candidates });
      continue;
    }

    resolved.push(selected);
  }

  if (conflicts.length) {
    throw new Error(`Códigos duplicados sin resolución: ${JSON.stringify(conflicts)}`);
  }

  return resolved;
}

function extractSynonyms(rows) {
  const synonyms = new Map();

  for (const row of rows) {
    const entries = row.synonymSource
      .split(';')
      .map((value) => value.trim().replace(/\s+/g, ' '))
      .filter(Boolean);

    for (const synonym of entries) {
      const synonymNormalized = normalizeSynonym(synonym);
      if (!synonymNormalized) continue;

      const key = `${row.codigo_producto}\u0000${synonymNormalized}`;
      if (!synonyms.has(key)) {
        synonyms.set(key, {
          codigo_producto: row.codigo_producto,
          synonym,
          synonym_normalized: synonymNormalized,
        });
      }
    }
  }

  return [...synonyms.values()];
}

async function upsertBatch(rows, productIdByCode) {
  const values = rows.map((row) => {
    const productId = productIdByCode.get(row.codigo_producto);
    if (!productId) {
      throw new Error(`Código no encontrado en inventory_product_catalog: ${row.codigo_producto}`);
    }

    return Prisma.sql`(
      ${productId},
      ${row.synonym},
      ${row.synonym_normalized},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )`;
  });

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "inventory_product_synonyms" (
      "product_id",
      "synonym",
      "synonym_normalized",
      "created_at",
      "updated_at"
    )
    VALUES ${Prisma.join(values, ', ')}
    ON CONFLICT ("product_id", "synonym_normalized") DO UPDATE SET
      "synonym" = EXCLUDED."synonym",
      "updated_at" = CURRENT_TIMESTAMP
  `);
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sourceFile);

  if (workbook.worksheets.length !== 1) {
    throw new Error(`Se esperaba una hoja oficial; se encontraron ${workbook.worksheets.length}`);
  }

  const rows = resolveDuplicateRows(readOfficialRows(workbook.worksheets[0]));
  const synonyms = extractSynonyms(rows);
  const codes = [...new Set(synonyms.map((row) => row.codigo_producto))];
  const products = await prisma.inventory_product_catalog.findMany({
    where: { codigo_producto: { in: codes } },
    select: { id: true, codigo_producto: true },
  });
  const productIdByCode = new Map(products.map((product) => [product.codigo_producto, product.id]));
  const missingCodes = codes.filter((code) => !productIdByCode.has(code));

  if (missingCodes.length) {
    throw new Error(
      `Códigos sin producto oficial en inventory_product_catalog: ${missingCodes.join(', ')}`
    );
  }

  for (let offset = 0; offset < synonyms.length; offset += BATCH_SIZE) {
    await upsertBatch(synonyms.slice(offset, offset + BATCH_SIZE), productIdByCode);
  }

  console.log(`[seed.inventory-product-synonyms] Cargados ${synonyms.length} sinónimos oficiales`);
}

main()
  .catch((error) => {
    console.error('[seed.inventory-product-synonyms] Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
