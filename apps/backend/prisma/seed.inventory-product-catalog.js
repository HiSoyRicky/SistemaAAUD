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
  englishTitle: 'TITULO DE PRODUCTOS EN INGLES',
  spanishTitle: 'TITULO DE PRODUCTOS EN ESPAÑOL',
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

function readOfficialRows(worksheet) {
  const indexes = getHeaderIndexes(worksheet);
  const rows = [];
  const invalidRows = [];

  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const code = cellText(row.getCell(indexes.code)).trim();
    const spanishTitle = cellText(row.getCell(indexes.spanishTitle));
    const englishValue = cellText(row.getCell(indexes.englishTitle));
    const rowValues = row.values.slice(1);
    const isEmpty = rowValues.every(
      (value) => value === null || value === undefined || String(value).trim() === ''
    );

    if (isEmpty) return;

    const reasons = [];
    if (!code) reasons.push('codigo_producto vacío');
    if (!spanishTitle.trim()) reasons.push('titulo_espanol vacío');

    if (reasons.length) {
      invalidRows.push({ rowNumber, reasons });
      return;
    }

    rows.push({
      rowNumber,
      codigo_producto: code,
      titulo_espanol: spanishTitle,
      titulo_ingles: englishValue.trim() ? englishValue : null,
    });
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

async function upsertBatch(rows) {
  const values = rows.map(
    (row) =>
      Prisma.sql`(
      ${row.codigo_producto},
      ${row.titulo_espanol},
      ${row.titulo_ingles},
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )`
  );

  const query = Prisma.sql`
    INSERT INTO "inventory_product_catalog" (
      "codigo_producto",
      "titulo_espanol",
      "titulo_ingles",
      "activo",
      "created_at",
      "updated_at"
    )
    VALUES ${Prisma.join(values, ', ')}
    ON CONFLICT ("codigo_producto") DO UPDATE SET
      "titulo_espanol" = EXCLUDED."titulo_espanol",
      "titulo_ingles" = EXCLUDED."titulo_ingles",
      "updated_at" = CURRENT_TIMESTAMP
  `;

  await prisma.$executeRaw(query);
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sourceFile);

  if (workbook.worksheets.length !== 1) {
    throw new Error(`Se esperaba una hoja oficial; se encontraron ${workbook.worksheets.length}`);
  }

  const rows = resolveDuplicateRows(readOfficialRows(workbook.worksheets[0]));

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    await upsertBatch(rows.slice(offset, offset + BATCH_SIZE));
  }

  console.log(`[seed.inventory-product-catalog] Cargados ${rows.length} productos oficiales`);
}

main()
  .catch((error) => {
    console.error('[seed.inventory-product-catalog] Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
