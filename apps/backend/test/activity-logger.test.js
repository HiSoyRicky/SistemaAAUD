import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activityContext,
  isActivityLoggingSuppressed,
  runWithActivityLoggingSuppressed,
} from '../src/common/services/activityLogger.js';

test('suprime solo los modelos indicados y conserva el contexto confiable', async () => {
  const requestContext = { userId: 17, ipAddress: '127.0.0.1' };
  const observed = await activityContext.run(requestContext, () =>
    runWithActivityLoggingSuppressed(['bd_inventory'], async () => ({
      userId: activityContext.getStore().userId,
      inventorySuppressed: isActivityLoggingSuppressed('bd_inventory'),
      devicesSuppressed: isActivityLoggingSuppressed('inventory_devices'),
    }))
  );

  assert.deepEqual(observed, {
    userId: 17,
    inventorySuppressed: true,
    devicesSuppressed: false,
  });
  assert.equal(activityContext.getStore(), undefined);
});

test('combina ámbitos de supresión anidados sin modificar el ámbito padre', async () => {
  await runWithActivityLoggingSuppressed(['bd_inventory'], async () => {
    await runWithActivityLoggingSuppressed(['inventory_devices'], async () => {
      assert.equal(isActivityLoggingSuppressed('bd_inventory'), true);
      assert.equal(isActivityLoggingSuppressed('inventory_devices'), true);
    });

    assert.equal(isActivityLoggingSuppressed('bd_inventory'), true);
    assert.equal(isActivityLoggingSuppressed('inventory_devices'), false);
  });
});