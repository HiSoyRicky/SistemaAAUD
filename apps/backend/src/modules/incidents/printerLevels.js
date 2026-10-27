import { isIPv4 } from 'node:net';
import { prisma } from '../../config/prisma.js';
import AppError from '../../common/utils/AppError.js';
import { readPrinterSupplies } from './printerSnmp.js';

const cache = new Map();
function positive(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new AppError('Selección de impresora inválida', 400);
  return number;
}
// Solo direcciones privadas: nunca convertir el selector público en un escáner de red o localhost.
export function isPrivatePrinterIp(ip) {
  if (!isIPv4(ip)) return false;
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
function selection(query, { requireModel = true } = {}) {
  return {
    id_ubication: positive(query.id_ubication),
    id_department: positive(query.id_department),
    ...((requireModel || query.id_printer_model !== undefined) && { id_printer_model: positive(query.id_printer_model) }),
  };
}
function whereFor({ id_ubication, id_department, id_printer_model }) {
  return { ...(id_printer_model !== undefined && { id_model: id_printer_model }), device: { name: 'Impresora' }, inventory: { is: { id_ubication, id_department } } };
}
const LEXMARK_CARTRIDGE_COLORS = {
  'BLACK CARTRIDGE': 'BLACK',
  'CYAN CARTRIDGE': 'CYAN',
  'MAGENTA CARTRIDGE': 'MAGENTA',
  'YELLOW CARTRIDGE': 'YELLOW',
};
export async function listPhysicalPrinters(query, db = prisma) {
  const selected = selection(query, { requireModel: false });
  const records = await db.inventory_devices.findMany({ where: whereFor(selected), select: { id: true, id_model: true, ip: true, inventory: { select: { tag: true, description: true } }, brand: { select: { name: true } }, model: { select: { name: true } } }, orderBy: { id: 'asc' } });
  return records.map((record) => ({ id: record.id, id_printer_model: record.id_model, tag: record.inventory.tag, description: record.inventory.description || null, brand: record.brand?.name || null, model: record.model?.name || null, available: isPrivatePrinterIp(String(record.ip || '').trim()) }));
}
export async function getPrinterLevels(id, query, { db = prisma, read = readPrinterSupplies } = {}) {
  const selected = selection(query);
  const printer = await db.inventory_devices.findFirst({ where: { ...whereFor(selected), id: positive(id) }, select: { id: true, ip: true, brand: { select: { name: true } }, model: { select: { toners: { select: { toner_model: true, color: true } } } } } });
  if (!printer) throw new AppError('Impresora no encontrada en la ubicación seleccionada', 404);
  const checked_at = new Date().toISOString();
  const ip = String(printer.ip || '').trim();
  if (!isPrivatePrinterIp(ip)) return { status: 'unavailable', checked_at, supplies: [] };
  const key = `${printer.id}:${ip}`; const existing = cache.get(key);
  if (existing && existing.until > Date.now()) return existing.promise;
  const promise = (async () => {
    try {
      const supplies = await read(ip);
      const colors = new Map(printer.model.toners.filter((item) => item.toner_model).map((item) => [item.toner_model.trim().toUpperCase(), item.color]));
      const isLexmark = printer.brand?.name?.trim().toUpperCase() === 'LEXMARK';
      return { status: 'ok', checked_at, supplies: supplies.map((s) => {
        const label = s.model.trim().toUpperCase();
        return { ...s, color: colors.get(label) || (isLexmark ? LEXMARK_CARTRIDGE_COLORS[label] : null) || null };
      }) };
    } catch { return { status: 'unavailable', checked_at, supplies: [] }; }
  })();
  if (cache.size >= 100) cache.delete(cache.keys().next().value);
  cache.set(key, { until: Date.now() + 60_000, promise });
  return promise;
}
