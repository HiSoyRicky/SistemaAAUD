import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_ENV_PATH = path.resolve(SCRIPT_DIR, '../../../.env');
dotenv.config({ path: ROOT_ENV_PATH });

const prisma = new PrismaClient();

const FILE_PATH = new URL('../../../tools/LISTADO DE STOCKS AGOSTO 2026.xlsx', import.meta.url);
const VALID_UNITS = new Set([
  'BID', 'BOL', 'BTO', 'C/U', 'CA', 'CJ', 'CTO', 'DOC', 'FRC', 'GLN', 'GRF', 'KG', 'L', 'LB',
  'LTA', 'M', 'M2', 'M3', 'MLR', 'PAA', 'PAQ', 'PIE', 'PLG', 'PT', 'RES', 'ROL', 'SAC', 'TF',
  'TRA', 'TUB', 'YD',
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function cellText(row, column) {
  return String(row.getCell(column).text || '').trim();
}

function findHeaderRow(worksheet) {
  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, 10); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (normalize(cellText(row, 1)) === 'MATERIAL' && normalize(cellText(row, 2)).includes('TEXTO BREVE')) {
      return rowNumber;
    }
  }
  throw new Error('No se encontró la fila de encabezados Material/Texto breve de material');
}

function readRows(worksheet, headerRow) {
  const rows = [];
  for (let rowNumber = headerRow + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    rows.push({
      rowNumber,
      code: cellText(row, 1),
      name: cellText(row, 2),
      unit: cellText(row, 3).toUpperCase(),
    });
  }
  return rows;
}

function analyzeRows(rows) {
  const valid = [];
  const invalid = [];
  const codes = new Map();
  const names = new Map();

  rows.forEach((row) => {
    const errors = [];
    if (!row.code) errors.push('código vacío');
    if (!row.name) errors.push('nombre vacío');
    if (!VALID_UNITS.has(row.unit)) errors.push(`unidad inválida: ${row.unit || '(vacía)'}`);
    if (row.code.length > 50) errors.push('código supera 50 caracteres');
    if (row.name.length > 150) errors.push('nombre supera 150 caracteres');
    if (row.unit.length > 30) errors.push('unidad supera 30 caracteres');

    if (errors.length) {
      invalid.push({ ...row, errors });
      return;
    }

    valid.push(row);
    const normalizedName = normalize(row.name);
    if (!codes.has(row.code)) codes.set(row.code, []);
    codes.get(row.code).push(row);
    if (!names.has(normalizedName)) names.set(normalizedName, []);
    names.get(normalizedName).push(row);
  });

  return {
    valid,
    invalid,
    duplicateCodes: [...codes.values()].filter((group) => group.length > 1),
    duplicateNames: [...names.values()].filter((group) => group.length > 1),
  };
}

async function inspectDatabase(validRows, db = prisma) {
  const codes = validRows.map((row) => row.code);
  const existing = await db.warehouseItem.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true, name: true, unit: true },
  });
  const existingByCode = new Map(existing.map((item) => [item.code, item]));
  const newRows = validRows.filter((row) => !existingByCode.has(row.code));
  const updates = validRows.filter((row) => existingByCode.has(row.code));

  return { existingByCode, newRows, updates };
}

export { analyzeRows, normalize };

export async function main() {
  const apply = process.argv.includes('--apply');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(FILE_PATH);
  const worksheet = workbook.worksheets[0];
  const headerRow = findHeaderRow(worksheet);
  const analysis = analyzeRows(readRows(worksheet, headerRow));
  const database = await inspectDatabase(analysis.valid);

  console.log(`[warehouse.catalog] Modo: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`[warehouse.catalog] Filas válidas: ${analysis.valid.length}`);
  console.log(`[warehouse.catalog] Filas inválidas: ${analysis.invalid.length}`);
  console.log(`[warehouse.catalog] Códigos duplicados en Excel: ${analysis.duplicateCodes.length}`);
  console.log(`[warehouse.catalog] Nombres duplicados normalizados: ${analysis.duplicateNames.length}`);
  console.log(`[warehouse.catalog] Nuevos por código: ${database.newRows.length}`);
  console.log(`[warehouse.catalog] Existentes por código: ${database.updates.length}`);
  console.log('[warehouse.catalog] Stock, categorías y valor del Excel: no se importan.');

  if (analysis.invalid.length) {
    console.log('[warehouse.catalog] Ejemplos inválidos:', JSON.stringify(analysis.invalid.slice(0, 10)));
  }
  if (analysis.duplicateNames.length) {
    console.log('[warehouse.catalog] Ejemplos de nombres duplicados:', JSON.stringify(analysis.duplicateNames.slice(0, 10)));
  }

  if (!apply) {
    console.log('[warehouse.catalog] Dry-run finalizado. Para escribir use --apply después de revisar este resumen.');
    return;
  }

  if (analysis.invalid.length || analysis.duplicateCodes.length) {
    throw new Error('Importación detenida: corrija las inconsistencias del Excel antes de usar --apply');
  }

  const rowsToCreate = analysis.valid
    .filter((row) => !database.existingByCode.has(row.code))
    .map((row) => ({
      code: row.code,
      name: row.name,
      unit: row.unit,
      category: null,
      min_stock: 0,
      active: true,
    }));

  await prisma.$transaction([
    prisma.warehouseItem.createMany({
      data: rowsToCreate,
      skipDuplicates: true,
    }),
  ]);

  console.log(`[warehouse.catalog] Importación completada: ${analysis.valid.length} registros procesados.`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main()
    .catch((error) => {
      console.error('[warehouse.catalog] Error:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
