'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function verifyBuild(dir) {
  // This verifies HTML entrypoints only, not dynamic imports or CSS dependencies.
  const root = fs.realpathSync(dir);
  const index = path.join(root, 'index.html');
  const html = fs.readFileSync(index, 'utf8');
  if (!/<html\b/i.test(html)) throw new Error('index.html inválido');
  const resources = [...html.matchAll(/\b(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((m) => m[1]);
  if (!resources.some((file) => /\.js(?:\?|$)/.test(file))) throw new Error('Falta JavaScript en index.html');
  for (const resource of resources) {
    const relative = decodeURIComponent(resource.split('?')[0]).replace(/^\//, '');
    const file = fs.realpathSync(path.join(root, relative));
    if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile()) throw new Error(`Recurso inválido: ${resource}`);
  }
  return resources.length;
}

function retainAssets(previousDir, destination) {
  if (!previousDir) return;
  const previousAssets = path.join(fs.realpathSync(previousDir), 'assets');
  if (!fs.existsSync(previousAssets)) return;
  const targetAssets = path.join(destination, 'assets');
  fs.mkdirSync(targetAssets, { recursive: true });
  const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const copy = (sourceDir, targetDir, relative = '') => {
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
      const source = path.join(sourceDir, entry.name);
      const target = path.join(targetDir, entry.name);
      const name = path.join(relative, entry.name);
      let targetEntry;
      try { targetEntry = fs.lstatSync(target); } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (entry.isDirectory()) {
        if (targetEntry && !targetEntry.isDirectory()) throw new Error(`Colisión de recurso: ${name}`);
        if (!targetEntry) fs.mkdirSync(target);
        copy(source, target, name);
      } else if (entry.isFile()) {
        if (targetEntry && (!targetEntry.isFile() || hash(source) !== hash(target))) {
          throw new Error(`Colisión de recurso: ${name}`);
        }
        if (!targetEntry) fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
      } else {
        throw new Error(`Recurso anterior no compatible: ${name}`);
      }
    }
  };
  if (!fs.lstatSync(previousAssets).isDirectory() || !fs.lstatSync(targetAssets).isDirectory()) {
    throw new Error('El directorio assets debe ser un directorio real');
  }
  copy(previousAssets, targetAssets);
}

// A caller must hold an exclusive deployment lock across prepare and switchCurrent.
function prepare(buildDir, releasesDir, name, previousDir = null) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) || name === '.' || name === '..') throw new Error('Nombre de release inválido');
  verifyBuild(buildDir);
  fs.mkdirSync(releasesDir, { recursive: true });
  const destination = path.join(releasesDir, name);
  fs.mkdirSync(destination);
  fs.cpSync(buildDir, destination, { recursive: true, errorOnExist: true });
  retainAssets(previousDir, destination);
  verifyBuild(destination);
  return destination;
}

function switchCurrent(current, release) {
  const target = fs.realpathSync(release);
  verifyBuild(target);
  try {
    if (!fs.lstatSync(current).isSymbolicLink()) throw new Error('El destino actual existe y no es un enlace simbólico');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const previous = fs.existsSync(current) ? fs.realpathSync(current) : null;
  const temporary = `${current}.next-${process.pid}`;
  fs.symlinkSync(target, temporary, 'dir');
  try { fs.renameSync(temporary, current); } catch (error) { fs.unlinkSync(temporary); throw error; }
  return previous;
}

module.exports = { verifyBuild, prepare, switchCurrent };
