import assert from 'node:assert/strict';
import test from 'node:test';
import router from '../src/modules/inventory/inventory.routes.js';

for (const [method, path, permission] of [
  ['post', '/classification-rules', 'inventory_classification_rules.create'],
  ['put', '/classification-rules/:id', 'inventory_classification_rules.update'],
  ['patch', '/classification-rules/:id/status', 'inventory_classification_rules.update'],
]) {
  test(`${method} ${path} exige ${permission}`, async () => {
    const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route;
    const authorize = route.stack[0].handle;
    for (const [permissions, allowed] of [
      [['inventory_classification_rules.read', 'inventory.update'], false],
      [[permission], true],
    ]) {
      let status;
      let body;
      let nextCalled = false;
      const res = { status(value) { status = value; return this; }, json(value) { body = value; } };
      await authorize({ user: { id: 1, permissionsLoaded: true, permissions } }, res, () => { nextCalled = true; });
      assert.equal(nextCalled, allowed);
      if (!allowed) {
        assert.equal(status, 403);
        assert.deepEqual(body.requiredPermissions, [permission]);
      }
    }
  });
}
