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

test('un comando exitoso sin stdout devuelve una cadena vacía', () => {
  assert.equal(release.exec('true'), '');
});

test('un comando que produce salida devuelve una cadena recortada', () => {
  assert.equal(release.exec('printf "  salida  "', { silent: true }), 'salida');
});

test('un comando exitoso que devuelve Buffer se normaliza a string', () => {
  assert.equal(release.exec('printf "buffer"', { silent: true, encoding: null }), 'buffer');
});

test('una consulta de commits fallida devuelve una lista vacía', () => {
  assert.deepEqual(release.getCommitsSinceTag('tag-inexistente-de-prueba'), []);
});

test('isWorkingTreeClean devuelve un booleano cuando Git no produce salida', () => {
  assert.equal(typeof release.isWorkingTreeClean(), 'boolean');
});
