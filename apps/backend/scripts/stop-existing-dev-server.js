import { execFileSync } from 'node:child_process';
import { existsSync, readlinkSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceDirectory = path.resolve(backendDirectory, '../..');
const port = process.env.PORT || '3000';

let listenerPids = [];
try {
  listenerPids = execFileSync('lsof', [`-tiTCP:${port}`, '-sTCP:LISTEN'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
} catch {
  // No listener on the development port, or lsof is unavailable.
}

for (const pid of listenerPids) {
  const processDirectory = `/proc/${pid}/cwd`;
  const commandLine = `/proc/${pid}/cmdline`;
  if (!existsSync(processDirectory) || !existsSync(commandLine)) continue;

  let cwd;
  let command;
  try {
    cwd = readlinkSync(processDirectory);
    command = execFileSync('ps', ['-p', String(pid), '-o', 'args='], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    continue;
  }

  // Never terminate an unrelated service that happens to use port 3000.
  if (![backendDirectory, workspaceDirectory].includes(cwd) || !command.includes('Server.js')) continue;

  const parentPid = Number(
    execFileSync('ps', ['-p', String(pid), '-o', 'ppid='], { encoding: 'utf8' }).trim()
  );
  const parentCommand = Number.isInteger(parentPid)
    ? execFileSync('ps', ['-p', String(parentPid), '-o', 'args='], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    : '';
  const parentDirectory = `/proc/${parentPid}/cwd`;
  const supervisorPid =
    parentCommand.includes('nodemon') &&
    existsSync(parentDirectory) &&
    readlinkSync(parentDirectory) === workspaceDirectory
      ? parentPid
      : null;

  // Stop nodemon first so it cannot respawn the listener while we replace it.
  for (const targetPid of [supervisorPid, pid].filter(Boolean)) {
    console.log(`Deteniendo el backend anterior (PID ${targetPid}, puerto ${port})`);
    try {
      process.kill(targetPid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }

  for (let attempt = 0; attempt < 30 && existsSync(processDirectory); attempt += 1) {
    await delay(100);
  }

  if (existsSync(processDirectory)) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
}
