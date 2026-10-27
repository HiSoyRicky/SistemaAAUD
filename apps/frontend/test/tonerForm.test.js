import assert from 'node:assert/strict';
import test from 'node:test';
import { getCurrentPrinterLevels, mergeTonerDescription } from '../src/modules/incidents/utils/tonerForm.js';

test('preserva observaciones al cambiar el texto automático', () => {
  assert.equal(mergeTonerDescription('Modelo | Cian\nUrgente', 'Modelo | Cian', 'Modelo | Negro'), 'Modelo | Negro\nUrgente');
  assert.equal(mergeTonerDescription('Texto editado', 'Modelo | Cian', 'Modelo | Negro'), 'Modelo | Negro\nTexto editado');
});

test('descarta lecturas de otra impresora o modelo', () => {
  const reading = { printerId: '3', modelId: '5', data: { status: 'ok' } };
  assert.equal(getCurrentPrinterLevels(reading, '3', '5'), reading.data);
  assert.equal(getCurrentPrinterLevels(reading, '4', '5'), null);
  assert.equal(getCurrentPrinterLevels(reading, '3', '6'), null);
});
