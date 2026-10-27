import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeResponse } from '../src/modules/incidents/printerSnmp.js';
import { getPrinterLevels, isPrivatePrinterIp, listPhysicalPrinters } from '../src/modules/incidents/printerLevels.js';
import { resolveSelectedTonerPrinter } from '../src/modules/incidents/incidentService.js';

const query = { id_ubication: '2', id_department: '3', id_printer_model: '4' };
test('solo permite IP privadas y nunca expone IP en el listado', async () => {
  assert.equal(isPrivatePrinterIp('10.252.121.212'), true);
  for (const ip of ['127.0.0.1', '8.8.8.8', '169.254.169.254', 'localhost', '::1']) assert.equal(isPrivatePrinterIp(ip), false);
  const db = { inventory_devices: { findMany: async ({ where }) => {
    assert.equal(where.id_model, 4); assert.equal(where.inventory.is.id_department, 3);
    return [{ id: 1, id_model: 4, ip: '10.1.2.3', inventory: { tag: '123' } }];
  } } };
  assert.deepEqual(await listPhysicalPrinters(query, db), [{ id: 1, id_printer_model: 4, tag: '123', description: null, brand: null, model: null, available: true }]);
});
test('lista impresoras del departamento sin modelo y exige modelo para consultar niveles', async () => {
  const db = { inventory_devices: { findMany: async ({ where, take }) => {
    assert.equal('id_model' in where, false);
    assert.equal(where.inventory.is.id_ubication, 2);
    assert.equal(where.inventory.is.id_department, 3);
    assert.equal(take, undefined);
    return [{ id: 1, id_model: 4, ip: '10.1.2.3', inventory: { tag: '123' } }];
  } } };
  assert.deepEqual(await listPhysicalPrinters({ id_ubication: '2', id_department: '3' }, db), [{ id: 1, id_printer_model: 4, tag: '123', description: null, brand: null, model: null, available: true }]);
  await assert.rejects(() => getPrinterLevels(1, { id_ubication: '2', id_department: '3' }, { db }), /inválida/);
  await assert.rejects(() => listPhysicalPrinters({ id_ubication: '2', id_department: '3', id_printer_model: 'abc' }, db), /inválida/);
});
test('vincula impresora concreta solo si pertenece a modelo, tóner y departamento', async () => {
  const payload = { ...query, id_printer_device: 5, id_toner: 8 };
  let captured;
  const tx = { inventory_devices: { findFirst: async (args) => { captured = args; return { ip: '10.1.2.3', inventory: { tag: '123' } }; } } };
  assert.deepEqual(await resolveSelectedTonerPrinter({ categoryName: 'Solicitud de tóner', payload, tx }), { tag: '123', ip: '10.1.2.3' });
  assert.equal(captured.where.id, 5);
  assert.equal(captured.where.id_model, 4);
  assert.equal(captured.where.inventory.is.id_department, 3);
  assert.equal(captured.where.model.toners.some.id, 8);
  await assert.rejects(() => resolveSelectedTonerPrinter({ categoryName: 'Solicitud de tóner', payload, tx: { inventory_devices: { findFirst: async () => null } } }), /no corresponde/);
  await assert.rejects(() => resolveSelectedTonerPrinter({ categoryName: 'Otro', payload, tx }), /inválida/);
});
test('verifica pertenencia antes de consultar y responde sin IP', async () => {
  let reads = 0;
  const options = { db: { inventory_devices: { findFirst: async ({ where }) => {
    assert.equal(where.id, 45); assert.equal(where.inventory.is.id_ubication, 2);
    return { id: 45, ip: '10.1.2.3', model: { toners: [{ toner_model: 'TK-8337Y', color: 'YELLOW' }] } };
  } } }, read: async () => { reads++; return [{ model: 'TK-8337Y', percent: 13 }]; } };
  const result = await getPrinterLevels(45, query, options);
  assert.equal(result.status, 'ok'); assert.deepEqual(result.supplies, [{ model: 'TK-8337Y', percent: 13, color: 'YELLOW' }]);
  assert.equal('ip' in result, false); assert.equal(reads, 1);
  await assert.rejects(() => getPrinterLevels(99, query, { db: { inventory_devices: { findFirst: async () => null } }, read: () => { throw new Error('No debe consultar'); } }), /no encontrada/);
});
test('rechaza datos SNMP malformados o respuestas de otra solicitud', () => {
  assert.throws(() => decodeResponse(Buffer.from('3001', 'hex'), 1, 'public'));
  const response = Buffer.from('302b02010104067075626c6963a21e02010102010002010030133011060c2b060102012b0b0101020101020101', 'hex');
  assert.equal(decodeResponse(response, 1, 'public').value, 1);
  assert.throws(() => decodeResponse(response, 2, 'public'));
});
test('reconoce descripciones reales de cartuchos Lexmark sin clasificar otros consumibles', async () => {
  const db = { inventory_devices: { findFirst: async () => ({ id: 726, ip: '10.1.2.4', brand: { name: 'Lexmark' }, model: { toners: [{ toner_model: '78C4XK0', color: 'BLACK' }] } }) } };
  const supplies = [
    { model: 'Black Cartridge', percent: 35 },
    { model: 'Cyan Cartridge', percent: 12 },
    { model: 'Waste Toner Bottle', percent: 90 },
  ];
  const result = await getPrinterLevels(726, query, { db, read: async () => supplies });
  assert.deepEqual(result.supplies.map((item) => item.color), ['BLACK', 'CYAN', null]);
  assert.deepEqual(result.supplies.map((item) => item.percent), [35, 12, 90]);
});
