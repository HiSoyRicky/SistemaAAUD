const assert = require('node:assert/strict');
const test = require('node:test');

const release = require('./release.cjs');

test('un comando Git fallido no provoca null.trim', () => {
  assert.equal(
    release.exec('git comando-inexistente-de-prueba', {
      throws: false,
      silent: true,
    }),
    ''
  );
});

test('una consulta de commits fallida devuelve una lista vacía', () => {
  assert.deepEqual(release.getCommitsSinceTag('tag-inexistente-de-prueba'), []);
});

test('isWorkingTreeClean devuelve un booleano cuando Git no produce salida', () => {
  assert.equal(typeof release.isWorkingTreeClean(), 'boolean');
});
