'use strict';

const fs = require('node:fs');
const { prepare, switchCurrent, verifyBuild } = require('./frontend-release.cjs');

const [, , command, ...args] = process.argv;

try {
  if (command === 'prepare') {
    const [build, releases, name, current] = args;

    if (!build || !releases || !name || !current) {
      throw new Error('Uso: prepare BUILD RELEASES NAME CURRENT');
    }

    const previous = fs.existsSync(current) ? fs.realpathSync(current) : null;

    const destination = prepare(build, releases, name, previous);
    console.log(destination);
  } else if (command === 'switch') {
    const [current, release] = args;

    if (!current || !release) {
      throw new Error('Uso: switch CURRENT RELEASE');
    }

    const previous = switchCurrent(current, release);
    console.log(previous || 'SIN_RELEASE_ANTERIOR');
  } else if (command === 'verify') {
    if (!args[0]) {
      throw new Error('Uso: verify DIR');
    }

    console.log(`OK: ${verifyBuild(args[0])} referencias verificadas`);
  } else {
    throw new Error('Comando no reconocido');
  }
} catch (error) {
  console.error(`[frontend-publish] ${error.message}`);
  process.exitCode = 1;
}
