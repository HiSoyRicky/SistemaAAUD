'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { verifyBuild, prepare, switchCurrent } = require('./frontend-release.cjs');

test('publica y recupera una versión sin retirar la anterior', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aaud-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const build = path.join(root, 'build'); fs.mkdirSync(path.join(build, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(build, 'index.html'), '<html><script src="/assets/app.js"></script></html>');
  fs.writeFileSync(path.join(build, 'assets/app.js'), 'ok');
  const releases = path.join(root, 'releases');
  const first = prepare(build, releases, 'one');
  const current = path.join(root, 'current');
  assert.equal(switchCurrent(current, first), null);
  fs.writeFileSync(path.join(build, 'assets/new.js'), 'new');
  fs.writeFileSync(path.join(build, 'index.html'), '<html><script src="/assets/new.js"></script></html>');
  fs.rmSync(path.join(build, 'assets/app.js'));
  const second = prepare(build, releases, 'two', first);
  assert.equal(fs.readFileSync(path.join(second, 'assets/app.js'), 'utf8'), 'ok');
  assert.equal(switchCurrent(current, second), first);
  assert.equal(fs.realpathSync(current), second);
  switchCurrent(current, first);
  assert.equal(fs.realpathSync(current), first);
  fs.rmSync(path.join(second, 'assets/new.js'));
  assert.throws(() => switchCurrent(current, second));
  assert.equal(fs.realpathSync(current), first);
  assert.throws(() => prepare(build, releases, '../escape'));
  assert.equal(verifyBuild(first), 1);
});

test('protege un directorio existente de publicación', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aaud-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'build/assets'), { recursive: true });
  fs.writeFileSync(path.join(root, 'build/index.html'), '<html><script src="/assets/app.js"></script></html>');
  fs.writeFileSync(path.join(root, 'build/assets/app.js'), 'ok');
  fs.mkdirSync(path.join(root, 'current'));
  assert.throws(() => switchCurrent(path.join(root, 'current'), path.join(root, 'build')), /no es un enlace/);
  assert.ok(fs.statSync(path.join(root, 'current')).isDirectory());
});

test('rechaza colisión de assets y no cambia la versión activa', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aaud-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const build = path.join(root, 'build');
  fs.mkdirSync(path.join(build, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(build, 'index.html'), '<html><script src="/assets/app.js"></script></html>');
  fs.writeFileSync(path.join(build, 'assets/app.js'), 'old');
  const releases = path.join(root, 'releases');
  const first = prepare(build, releases, 'one');
  const current = path.join(root, 'current');
  switchCurrent(current, first);
  fs.writeFileSync(path.join(build, 'assets/app.js'), 'different');
  assert.throws(() => prepare(build, releases, 'two', first), /Colisión/);
  assert.equal(fs.realpathSync(current), first);
  assert.equal(fs.readFileSync(path.join(current, 'assets/app.js'), 'utf8'), 'old');
});

test('conserva assets anidados y rechaza colisiones dentro de ellos', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aaud-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const build = path.join(root, 'build');
  fs.mkdirSync(path.join(build, 'assets/fonts'), { recursive: true });
  fs.writeFileSync(path.join(build, 'index.html'), '<html><script src="/assets/app.js"></script></html>');
  fs.writeFileSync(path.join(build, 'assets/app.js'), 'app');
  fs.writeFileSync(path.join(build, 'assets/fonts/old.woff2'), 'original');
  const releases = path.join(root, 'releases');
  const first = prepare(build, releases, 'one');
  const current = path.join(root, 'current');
  switchCurrent(current, first);

  fs.rmSync(path.join(build, 'assets/fonts/old.woff2'));
  const second = prepare(build, releases, 'two', first);
  assert.equal(fs.readFileSync(path.join(second, 'assets/fonts/old.woff2'), 'utf8'), 'original');
  fs.writeFileSync(path.join(build, 'assets/fonts/old.woff2'), 'different');
  assert.throws(() => prepare(build, releases, 'three', first), /Colisión de recurso: fonts\/old\.woff2/);
  assert.equal(fs.realpathSync(current), first);
  assert.equal(fs.readFileSync(path.join(current, 'assets/fonts/old.woff2'), 'utf8'), 'original');
});

test('rechaza enlaces simbólicos dentro de assets anteriores', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aaud-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const build = path.join(root, 'build');
  fs.mkdirSync(path.join(build, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(build, 'index.html'), '<html><script src="/assets/app.js"></script></html>');
  fs.writeFileSync(path.join(build, 'assets/app.js'), 'app');
  const releases = path.join(root, 'releases');
  const first = prepare(build, releases, 'one');
  const current = path.join(root, 'current');
  switchCurrent(current, first);
  fs.symlinkSync('/tmp', path.join(first, 'assets/linked'));
  assert.throws(() => prepare(build, releases, 'two', first), /Recurso anterior no compatible/);
  assert.equal(fs.realpathSync(current), first);
});
