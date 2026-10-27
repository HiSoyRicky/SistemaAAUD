#!/usr/bin/env node
'use strict';
// Planificador de retención AAUD. SOLO LECTURA. Nunca elimina archivos.
const fs = require('node:fs');
const path = require('node:path');

function plan(root, keep = 5) {
  if (!Number.isSafeInteger(keep) || keep < 5) throw new Error('keep debe ser un entero >= 5');
  const releases = path.join(root, 'releases');
  const current = path.join(root, 'current');
  if (!fs.lstatSync(current).isSymbolicLink()) throw new Error('current debe ser symlink');
  const releasesReal = fs.realpathSync(releases);
  const active = fs.realpathSync(current);
  if (path.dirname(active) !== releasesReal) throw new Error('current apunta fuera de releases');
  const items = fs.readdirSync(releases, { withFileTypes: true }).map(entry => {
    const full = path.join(releases, entry.name);
    if (!entry.isDirectory()) throw new Error('Entrada no directorio: ' + entry.name);
    const real = fs.realpathSync(full);
    if (path.dirname(real) !== releasesReal) throw new Error('Ruta no segura: ' + entry.name);
    const stat = fs.statSync(full);
    return { name: entry.name, path: full, time: stat.mtimeMs, active: real === active };
  });
  const sorted = [...items].sort((a, b) => b.time - a.time || b.name.localeCompare(a.name));
  // No inferir el anterior por antigüedad: puede haberse ejecutado rollback.
  // Hasta disponer de un manifiesto de despliegue, conservar todos los releases.
  return {
    active,
    keep,
    protected: sorted.map(x => x.name),
    candidates: [],
    reason: 'Sin manifiesto fiable del release anterior: política conservadora, no proponer eliminaciones.'
  };
}

try {
  if (process.argv.some(arg => ['--apply', '--delete', '--execute'].includes(arg))) {
    throw new Error('La eliminación no está implementada. Este comando solo simula.');
  }
  const root = process.env.AAUD_FRONTEND_ROOT || '/var/www/aaud-system/shared/frontend';
  const keepArg = process.argv.find(arg => arg.startsWith('--keep='));
  const keep = keepArg ? Number(keepArg.split('=')[1]) : 5;
  const result = plan(root, keep);
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('AAUD - Plan de retención (SOLO LECTURA)');
    console.log('Release activo: ' + result.active);
    console.log('Retención mínima solicitada: ' + result.keep);
    console.log('Releases protegidos: ' + result.protected.length);
    for (const name of result.protected) console.log('  PROTEGIDO ' + name);
    console.log('Candidatos para eliminar: 0');
    console.log(result.reason);
  }
} catch (error) {
  console.error('[release-retention] ' + error.message);
  process.exitCode = 1;
}
