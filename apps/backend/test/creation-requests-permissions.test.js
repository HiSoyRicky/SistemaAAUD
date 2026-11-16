import assert from 'node:assert/strict';
import test from 'node:test';
import router from '../src/modules/creationRequests/creationRequests.routes.js';

test('crear solicitudes requiere permiso explícito', async () => {
  const authorize = router.stack.find((layer) => layer.route?.path === '/' && layer.route.methods.post).route.stack[0].handle;
  for (const [permissions, allowed] of [[['brands.read'], false], [['creation_requests.create'], true], [['*.*'], true]]) {
    let status;
    let nextCalled = false;
    const res = { status(value) { status = value; return this; }, json() {} };
    await authorize({ user: { id: 1, permissionsLoaded: true, permissions } }, res, () => { nextCalled = true; });
    assert.equal(nextCalled, allowed);
    if (!allowed) assert.equal(status, 403);
  }
});
