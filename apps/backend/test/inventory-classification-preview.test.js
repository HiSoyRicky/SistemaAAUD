import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PREVIEW_STATUSES,
  buildClassificationPreview,
  summarizeClassificationPreview,
} from '../src/modules/inventory/services/inventory-classification-preview.service.js';

const rule = {
  id: 4,
  classification: { id: 8, code_new: '12040320', description: 'Equipo informático' },
  asset_type: { id: 9, code: 'TECHNOLOGY', name: 'Tecnología' },
  extension: { id: 10, code: 'DEVICES', name: 'Dispositivos' },
};

test('marca activo ya clasificado como ALREADY_CLASSIFIED', () => {
  const row = buildClassificationPreview({ id: 1, tag: 'AAUD-001', asset_classification_rule: rule });

  assert.equal(row.status, PREVIEW_STATUSES.ALREADY_CLASSIFIED);
  assert.equal(row.proposed_classification_rule_id, 4);
  assert.equal(row.proposed_extension.code, 'DEVICES');
});

test('marca activo sin evidencia patrimonial como AMBIGUOUS', () => {
  const row = buildClassificationPreview({ id: 2, tag: 'AAUD-002' });

  assert.equal(row.status, PREVIEW_STATUSES.AMBIGUOUS);
  assert.equal(row.proposed_classification_rule_id, null);
});

test('marca activo sin identificación mínima como UNCLASSIFIABLE', () => {
  const row = buildClassificationPreview({ id: null, tag: null });

  assert.equal(row.status, PREVIEW_STATUSES.UNCLASSIFIABLE);
});

test('resume múltiples activos sin alterar el preview', () => {
  const preview = [
    buildClassificationPreview({ id: 1, tag: 'A', asset_classification_rule: rule }),
    buildClassificationPreview({ id: 2, tag: 'B' }),
    buildClassificationPreview({ id: 3, tag: 'C', asset_classification_rule: rule }),
  ];

  assert.deepEqual(summarizeClassificationPreview(preview), {
    SAFE: 0,
    AMBIGUOUS: 1,
    UNCLASSIFIABLE: 0,
    ALREADY_CLASSIFIED: 2,
  });
  assert.equal(preview[1].status, PREVIEW_STATUSES.AMBIGUOUS);
});