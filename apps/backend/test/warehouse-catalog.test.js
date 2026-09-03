import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeRows, normalize } from '../scripts/import-warehouse-catalog.js';

test('permite nombres iguales cuando los códigos son diferentes', () => {
  const result = analyzeRows([
    { rowNumber: 1, code: 'CODE-A', name: 'ACEITE 20W-50', unit: 'GLN' },
    { rowNumber: 2, code: 'CODE-B', name: 'ACEITE 20W-50', unit: 'C/U' },
  ]);

  assert.equal(result.valid.length, 2);
  assert.equal(result.duplicateCodes.length, 0);
  assert.equal(result.duplicateNames.length, 1);
});

test('bloquea códigos repetidos aunque el nombre sea distinto', () => {
  const result = analyzeRows([
    { rowNumber: 1, code: 'CODE-A', name: 'PRODUCTO A', unit: 'C/U' },
    { rowNumber: 2, code: 'CODE-A', name: 'PRODUCTO B', unit: 'C/U' },
  ]);

  assert.equal(result.duplicateCodes.length, 1);
});

test('normaliza nombres solo para reportar posibles duplicados', () => {
  assert.equal(normalize('Papel Bond Carta'), 'PAPEL BOND CARTA');
  assert.equal(normalize('PAPEL-BOND  CARTA'), 'PAPEL BOND CARTA');
});