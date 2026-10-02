import assert from 'node:assert/strict';
import test from 'node:test';
import { publishIncidentEvent } from '../src/modules/incidents/incidentEventPublisher.js';

function createSocket(id, userId) {
  return {
    id,
    user: { id: userId },
    events: [],
    disconnected: false,
    emit(event, payload) {
      this.events.push({ event, payload });
    },
    disconnect() {
      this.disconnected = true;
    },
  };
}

function createIo(sockets) {
  return {
    of: () => ({ sockets: new Map(sockets.map((socket) => [socket.id, socket])) }),
  };
}

function createDb(users, incident = { id_technician: 20 }) {
  return {
    users: {
      findMany: async ({ where }) => users.filter((user) => where.id.in.includes(user.id)),
    },
    bd_incidents: {
      findUnique: async () => incident,
    },
  };
}

test('emite una actualización solo a managers y al técnico actualmente asignado', async () => {
  const sockets = [createSocket('manager', 1), createSocket('assigned', 20), createSocket('former', 30)];
  const permissions = new Map([
    [1, ['incidents.read', 'incidents.assign']],
    [20, ['incidents.read']],
    [30, ['incidents.read']],
  ]);
  const delivered = await publishIncidentEvent(
    createIo(sockets),
    { event: 'incidentUpdated', incidentId: 8, payload: { id_incident: 8 } },
    {
      db: createDb([{ id: 1, id_rol: 1, active: true }, { id: 20, id_rol: 2, active: true }, { id: 30, id_rol: 2, active: true }]),
      resolvePermissions: async ({ userId }) => permissions.get(userId),
    }
  );

  assert.equal(delivered, 2);
  assert.equal(sockets[0].events.length, 1);
  assert.equal(sockets[1].events.length, 1);
  assert.equal(sockets[2].events.length, 0);
});

test('revalida cada emisión y no envía datos después de revocar permisos de una conexión activa', async () => {
  const socket = createSocket('manager', 1);
  const permissions = ['incidents.read', 'incidents.assign'];
  const io = createIo([socket]);
  const dependencies = {
    db: createDb([{ id: 1, id_rol: 1, active: true }]),
    resolvePermissions: async () => permissions,
  };

  await publishIncidentEvent(
    io,
    { event: 'incidentCreated', incidentId: 8, payload: { id_incident: 8 }, managerOnly: true },
    dependencies
  );
  permissions.splice(0, permissions.length, 'incidents.read');
  const delivered = await publishIncidentEvent(
    io,
    { event: 'incidentCreated', incidentId: 9, payload: { id_incident: 9 }, managerOnly: true },
    dependencies
  );

  assert.equal(delivered, 0);
  assert.deepEqual(socket.events.map(({ payload }) => payload.id_incident), [8]);
});

test('deja de enviar al técnico anterior cuando cambia la asignación de la incidencia', async () => {
  const previousTechnician = createSocket('previous', 20);
  const nextTechnician = createSocket('next', 30);
  const incident = { id_technician: 20 };
  const db = createDb(
    [
      { id: 20, id_rol: 2, active: true },
      { id: 30, id_rol: 2, active: true },
    ],
    incident
  );
  const io = createIo([previousTechnician, nextTechnician]);
  const dependencies = {
    db,
    resolvePermissions: async () => ['incidents.read'],
  };

  await publishIncidentEvent(
    io,
    { event: 'incidentUpdated', incidentId: 8, payload: { id_incident: 8 } },
    dependencies
  );
  incident.id_technician = 30;
  await publishIncidentEvent(
    io,
    { event: 'incidentUpdated', incidentId: 8, payload: { id_incident: 8 } },
    dependencies
  );

  assert.equal(previousTechnician.events.length, 1);
  assert.equal(nextTechnician.events.length, 1);
});

test('desconecta sockets de usuarios inactivos al intentar emitir una incidencia', async () => {
  const socket = createSocket('inactive', 7);
  const delivered = await publishIncidentEvent(
    createIo([socket]),
    { event: 'incidentDeleted', incidentId: 8, payload: { id: 8 }, managerOnly: true },
    {
      db: createDb([{ id: 7, id_rol: 1, active: false }]),
      resolvePermissions: async () => ['*.*'],
    }
  );

  assert.equal(delivered, 0);
  assert.equal(socket.disconnected, true);
  assert.equal(socket.events.length, 0);
});