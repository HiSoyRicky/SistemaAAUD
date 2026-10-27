'use strict';

// Registro append-only de despliegues AAUD. No modifica releases ni respaldos.
// Usar desde deploy.sh SOLO tras publicar y verificar HTTP exitosamente.
// Formato JSON Lines: un evento por línea.
const fs = require('node:fs');
const path = require('node:path');

const REQUIRED = ['action', 'commit', 'release', 'previous_release', 'result'];
function assertEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Evento inválido');
  for (const field of REQUIRED) {
    if (typeof event[field] !== 'string' || !event[field].trim()) throw new Error('Campo obligatorio: ' + field);
  }
  if (!['deploy', 'rollback'].includes(event.action)) throw new Error('Acción inválida');
  if (!['success', 'failure'].includes(event.result)) throw new Error('Resultado inválido');
  for (const field of ['release', 'previous_release']) {
    if (event[field] !== 'initial' && !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(event[field])) {
      throw new Error('Nombre de release inválido: ' + field);
    }
  }
  if (!/^[0-9a-f]{40}$/.test(event.commit)) throw new Error('Commit debe ser SHA completo');
  for (const field of ['tag', 'backup']) {
    if (event[field] != null && typeof event[field] !== 'string') throw new Error('Campo inválido: ' + field);
  }
}

function appendEvent(file, event) {
  assertEvent(event);
  const directory = path.dirname(file);
  fs.mkdirSync(directory, { recursive: true, mode: 0o750 });
  const record = {
    schema_version: 1,
    timestamp: new Date().toISOString(),
    action: event.action,
    commit: event.commit,
    tag: event.tag || null,
    release: event.release,
    previous_release: event.previous_release,
    result: event.result,
    backup: event.backup || null
  };
  // O_APPEND evita sobrescrituras; la exclusión entre deploy y rollback
  // debe garantizarse externamente con el mismo bloqueo flock.
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW, 0o640);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new Error('El historial no es un archivo regular');
    fs.writeSync(fd, JSON.stringify(record) + '\n');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  return record;
}

module.exports = { assertEvent, appendEvent };
