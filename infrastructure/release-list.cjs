#!/usr/bin/env node
'use strict';

// Inventario de releases del frontend AAUD. Solo lectura: nunca borra ni publica.
const fs = require('node:fs');
const path = require('node:path');

const root = process.env.AAUD_FRONTEND_ROOT || '/var/www/aaud-system/shared/frontend';
const releases = path.join(root, 'releases');
const current = path.join(root, 'current');

function main() {
  if (!fs.existsSync(releases) || !fs.lstatSync(releases).isDirectory()) {
    throw new Error('No existe el directorio de releases: ' + releases);
  }
  if (!fs.existsSync(current) || !fs.lstatSync(current).isSymbolicLink()) {
    throw new Error('current no es un enlace simbólico válido: ' + current);
  }
  const active = fs.realpathSync(current);
  const releasesReal = fs.realpathSync(releases);
  if (path.dirname(active) !== releasesReal) {
    throw new Error('El release activo no está dentro de releases: ' + active);
  }

  const items = fs.readdirSync(releases, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const full = path.join(releases, entry.name);
      const real = fs.realpathSync(full);
      if (path.dirname(real) !== releasesReal) {
        throw new Error('Release fuera del directorio esperado: ' + entry.name);
      }
      const stat = fs.statSync(full);
      const match = entry.name.match(/^release-\d{8}-\d{6}-([0-9a-f]{12})-\d+$/);
      return {
        name: entry.name,
        active: real === active,
        commit_short: match ? match[1] : null,
        created_at: stat.birthtime.toISOString(),
        path: full
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!items.some(item => item.active)) throw new Error('No se encontró el release activo');
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ root, active, count: items.length, releases: items }, null, 2));
    return;
  }
  console.log('AAUD - Inventario de releases (solo lectura)');
  console.log('Activo: ' + active);
  console.log('Total: ' + items.length);
  for (const item of items) {
    console.log((item.active ? '[ACTIVO] ' : '[       ] ') + item.name +
      (item.commit_short ? '  commit=' + item.commit_short : '  commit=desconocido'));
  }
  console.log('No se ha modificado ni eliminado ningún archivo.');
}

try { main(); } catch (error) { console.error('[release-list] ' + error.message); process.exitCode = 1; }
