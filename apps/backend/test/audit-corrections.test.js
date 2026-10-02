import assert from 'node:assert/strict';
import express from 'express';
import test from 'node:test';
import { register } from '../src/modules/auth/auth.controller.js';
import {
  canAccessIncidentRoom,
  canReadAllIncidents,
  canReadIncidentManagerEvents,
} from '../src/modules/incidents/incidentAccess.js';
import {
  createIncidentBodySchema,
  incidentUpdateBodySchema,
} from '../src/modules/incidents/incidents.validator.js';
import {
  buildCreateData,
  createIncidentRecord,
  resolveTonerPrinterIps,
  validateIncidentLocation,
} from '../src/modules/incidents/incidentService.js';
import {
  appendPrinterIpsToIncidentDescription,
  getReporterIncidentDescription,
} from '../src/modules/incidents/incidentDescription.js';
import { synchronizeIncidentTicketNumberSequence } from '../src/modules/incidents/ticketSequence.js';
import { canChangePassword } from '../src/modules/users/users.service.js';
import { passwordSchema } from '../src/modules/auth/auth.validator.js';
import { createPendingTransferRequest } from '../src/modules/inventoryTransferRequests/inventoryTransferRequests.service.js';
import {
  resolveRoleDefaultPermissionCodes,
  splitPermissionCode,
} from '../src/common/rbac/permissions.catalog.js';
import { hasPermissionCode } from '../src/common/rbac/permissions.service.js';
import { getClientIp } from '../src/common/utils/clientInfo.js';
import { incidentCreateLimiter } from '../src/modules/incidents/incidents.routes.js';
import { validateCreateIncident } from '../src/modules/incidents/incidents.validator.js';
import {
  mapIncidentListItem,
  mapTonerRequestOptions,
} from '../src/modules/incidents/incidents.dto.js';
import {
  hasIncidentAssigneeColumn,
  queryIncidentsWithAssignmentFallback,
} from '../src/modules/incidents/incidents.repository.js';
import { updatedIncidentSelect } from '../src/modules/incidents/incidentUpdateService.js';

test('el registro público permanece deshabilitado sin invocar persistencia', async () => {
  let statusCode;
  let responseBody;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await register({ body: { username: 'attacker', id_rol: 1 } }, response);

  assert.equal(statusCode, 403);
  assert.match(responseBody.error, /registro público está deshabilitado/i);
});

test('los permisos limitan a técnico a sus incidencias asignadas', () => {
  const permissions = ['incidents.read'];

  assert.equal(
    canAccessIncidentRoom({
      permissions,
      userId: 12,
      incident: { id_technician: 12 },
    }),
    true
  );
  assert.equal(
    canAccessIncidentRoom({
      permissions,
      userId: 12,
      incident: { id_technician: 34 },
    }),
    false
  );
  assert.equal(
    canAccessIncidentRoom({
      permissions: ['incidents.assign', 'incidents.read'],
      userId: 12,
      incident: { id_technician: 34 },
    }),
    true
  );
  assert.equal(canReadAllIncidents(['incidents.assign']), true);
  assert.equal(canReadIncidentManagerEvents(['incidents.*']), true);
  assert.equal(canReadIncidentManagerEvents(['incidents.assign']), false);
  assert.equal(canAccessIncidentRoom({ userId: 12, incident: { id_technician: 12 } }), false);
});

test('la actualización valida estado, categoría y compatibilidad del alias id_category', () => {
  assert.equal(incidentUpdateBodySchema.safeParse({ status: 'Resuelto' }).success, true);
  assert.equal(incidentUpdateBodySchema.safeParse({ status: 'Cerrada' }).success, false);
  assert.equal(incidentUpdateBodySchema.safeParse({ id_status: 2 }).success, true);
  assert.equal(incidentUpdateBodySchema.safeParse({ id_category: '4' }).success, true);
  assert.equal(incidentUpdateBodySchema.safeParse({ description: 'válido', extra: true }).success, false);
  assert.equal(incidentUpdateBodySchema.safeParse({ id_technician: null }).success, false);
  assert.equal(incidentUpdateBodySchema.safeParse({}).success, false);
  assert.equal(
    incidentUpdateBodySchema.safeParse({ category: 4, id_category: 5 }).success,
    false
  );
  assert.equal(
    incidentUpdateBodySchema.safeParse({ description: `${'x'.repeat(256)}` }).success,
    false
  );
});

test('la creación de incidencia rechaza departamento fuera de ubicación', async () => {
  const tx = {
    departments: {
      findUnique: async () => ({ id: 5, id_ubication: 9 }),
    },
  };

  await assert.rejects(
    validateIncidentLocation(tx, { departmentId: 5, ubicationId: 2 }),
    { statusCode: 400 }
  );
  await validateIncidentLocation(tx, { departmentId: 5, ubicationId: 9 });
});

test('el INSERT de incidencia solo retorna id para convivir con columnas aún no migradas', async () => {
  let createArgs;
  const tx = {
    bd_incidents: {
      create: async (args) => {
        createArgs = args;
        return { id: 885 };
      },
    },
  };

  const created = await createIncidentRecord(tx, { id_user: 2, description: 'Prueba' });

  assert.deepEqual(createArgs.select, { id: true });
  assert.deepEqual(created, { id: 885 });
});

test('el DTO de tabla incluye categoría y usuario asignador para el modal de detalle', () => {
  const item = mapIncidentListItem({
    id: 885,
    ticket_number: 885,
    id_category: 2,
    description: 'Problema con impresora\n\n[IP impresora (soporte): 10.20.1.45]',
    assigned_by: 7,
    categories: { name: 'Problemas con el equipo' },
    users_bd_incidents_id_assigned_byTousers: { nombre_completo: 'María Asignó' },
  });

  assert.equal(item.category_name, 'Problemas con el equipo');
  assert.equal(item.description, 'Problema con impresora');
  assert.deepEqual(item.printer_ip_links, ['10.20.1.45']);
  assert.equal(item.assigned_by, 7);
  assert.equal(item.assigned_by_name, 'María Asignó');
});

test('las opciones públicas de tóner no incluyen IPs de impresoras', () => {
  const options = mapTonerRequestOptions([
    {
      id: 4,
      name: 'TASKalfa 3253ci',
      brands: { name: 'Kyocera' },
      inventory_devices: [{ ip: '10.20.1.45' }, { ip: ' 10.20.1.45 ' }, { ip: null }],
      toners: [{ id: 8, color: 'CYAN', toner_model: 'TK-8337C' }],
    },
  ]);

  assert.equal(Object.hasOwn(options.printers[0], 'printer_ips'), false);
});

test('la IP se deriva del equipo instalado y se anexa al mismo description almacenado', async () => {
  let query;
  const printerIps = await resolveTonerPrinterIps({
    categoryName: 'Solicitud de tóner',
    payload: {
      id_printer_model: '4',
      id_toner: '8',
      id_ubication: '2',
      id_department: '9',
    },
    tx: {
      models: {
        findFirst: async (args) => {
          query = args;
          return {
            inventory_devices: [
              { ip: '10.20.1.45' },
              { ip: ' 10.20.1.45 ' },
              { ip: null },
              { ip: '10.20.1.46' },
            ],
          };
        },
      },
    },
  });

  assert.deepEqual(printerIps, ['10.20.1.45', '10.20.1.46']);
  assert.equal(query.where.id, 4);
  assert.equal(query.where.toners.some.id, 8);
  assert.equal(query.where.inventory_devices.some.inventory.is.id_ubication, 2);
  assert.equal(query.where.inventory_devices.some.inventory.is.id_department, 9);

  const storedDescription = appendPrinterIpsToIncidentDescription(
    'Kyocera | TASKalfa | TK-8337C (Cian)',
    printerIps
  );
  assert.match(storedDescription, /IP impresora \(soporte\): 10\.20\.1\.45, 10\.20\.1\.46/);
  assert.equal(
    getReporterIncidentDescription(storedDescription),
    'Kyocera | TASKalfa | TK-8337C (Cian)'
  );
});

test('el listado de incidencias cae al select legacy solo si falta assigned_by', async () => {
  const calls = [];
  const baseQuery = {
    select: {
      id: true,
      assigned_by: true,
      users_bd_incidents_id_assigned_byTousers: { select: { nombre_completo: true } },
      categories: { select: { name: true } },
    },
  };
  const rows = await queryIncidentsWithAssignmentFallback(baseQuery, async (query) => {
    calls.push(query);
    if (calls.length === 1) {
      const error = new Error('The column bd_incidents.assigned_by does not exist');
      error.code = 'P2022';
      throw error;
    }
    return [{ id: 885, categories: { name: 'Problemas con el equipo' } }];
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].select.assigned_by, true);
  assert.equal('assigned_by' in calls[1].select, false);
  assert.ok(calls[1].select.categories);
  assert.equal(rows[0].categories.name, 'Problemas con el equipo');
});

test('el fallback de asignación no oculta otros errores de Prisma', async () => {
  const error = Object.assign(new Error('Database unavailable'), { code: 'P1001' });
  await assert.rejects(
    queryIncidentsWithAssignmentFallback({ select: { assigned_by: true } }, async () => {
      throw error;
    }),
    error
  );
});

test('la actualización transaccional no selecciona assigned_by opcional antes del fallback', () => {
  assert.equal(Object.hasOwn(updatedIncidentSelect, 'assigned_by'), false);
  assert.equal(
    Object.hasOwn(updatedIncidentSelect, 'users_bd_incidents_id_assigned_byTousers'),
    false
  );
});

test('detecta si el esquema permite persistir el usuario asignador', async () => {
  const migrated = await hasIncidentAssigneeColumn({
    $queryRaw: async () => [{ exists: true }],
  });
  const legacy = await hasIncidentAssigneeColumn({
    $queryRaw: async () => [{ exists: false }],
  });

  assert.equal(migrated, true);
  assert.equal(legacy, false);
});

test('la incidencia pública usa siempre el usuario genérico y no acepta id_user del cliente', () => {
  const incident = buildCreateData(
    {
      id_user: 999,
      id_ubication: 1,
      id_department: 2,
      id_category: 3,
      reporter_name: 'Reportante de prueba',
      description: 'Incidencia de prueba',
      status: 'Resuelto',
      solution: 'No aceptar esta solución del cliente',
      solution_date: '2026-10-02T12:00:00.000Z',
    },
    '127.0.0.1'
  );

  assert.equal(incident.id_user, 2);
  assert.equal(incident.id_status, 1);
  assert.equal(incident.solution, '');
  assert.equal(incident.solution_date, null);
  assert.equal(
    createIncidentBodySchema.safeParse({
      reporter_name: 'Reportante de prueba',
      id_user: 999,
      id_ubication: 1,
      id_department: 2,
      id_category: 3,
      description: 'Incidencia de prueba',
    }).success,
    false
  );
  assert.equal(
    createIncidentBodySchema.safeParse({
      reporter_name: 'Reportante de prueba',
      id_ubication: 1,
      id_department: 2,
      id_category: 3,
      description: 'Incidencia de prueba',
      status: 'Resuelto',
      solution: 'Falsificada',
    }).success,
    false
  );
});

test('el IP registrado usa el IP resuelto por Express y no un X-Forwarded-For arbitrario', () => {
  assert.equal(
    getClientIp({
      ip: '203.0.113.7',
      headers: { 'x-forwarded-for': '198.51.100.90' },
      socket: { remoteAddress: '127.0.0.1' },
    }),
    '203.0.113.7'
  );
  assert.equal(
    getClientIp({ socket: { remoteAddress: '::ffff:192.0.2.1' }, headers: {} }),
    '192.0.2.1'
  );
});

test('el límite ignora formularios inválidos y bloquea el segundo envío válido por IP', async () => {
  const app = express();
  app.use(express.json());
  app.post('/incidents', validateCreateIncident, incidentCreateLimiter, (_req, res) => {
    res.status(201).json({ success: true });
  });
  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({ error: error.message });
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const url = `http://127.0.0.1:${server.address().port}/incidents`;
    const first = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const validPayload = {
      reporter_name: 'Reportante de prueba',
      id_ubication: 1,
      id_department: 2,
      id_category: 3,
      description: 'Incidencia de prueba',
    };
    const firstValid = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    const secondValid = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const firstBody = await first.text();
    assert.equal(first.status, 400, firstBody);
    assert.equal(firstValid.status, 201);
    assert.equal(secondValid.status, 429);
    assert.ok(Number(secondValid.headers.get('retry-after')) > 0);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test('la secuencia de tickets se sincroniza bajo bloqueo antes de generar el siguiente valor', async () => {
  const calls = [];
  const tx = {
    async $executeRaw(strings) {
      calls.push(['lock', strings.join(' ')]);
    },
    async $queryRaw(strings) {
      calls.push(['sync', strings.join(' ')]);
      return [];
    },
  };

  const db = { $transaction: (callback) => callback(tx) };
  await synchronizeIncidentTicketNumberSequence(db);

  assert.match(calls[0][1], /LOCK TABLE "bd_incidents" IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(calls[1][1], /setval\(/);
  assert.match(calls[1][1], /pg_sequence_last_value/);
  assert.deepEqual(calls.map(([name]) => name), ['lock', 'sync']);
});

test('los permisos por defecto conservan solicitudes actuales y no dan revisión a roles personalizados', () => {
  const technician = resolveRoleDefaultPermissionCodes('Técnico');
  const consultant = resolveRoleDefaultPermissionCodes('Consultor');

  assert.ok(technician.includes('inventory_transfers.create'));
  assert.ok(technician.includes('inventory_transfers.read_own'));
  assert.ok(consultant.includes('inventory_transfers.create'));
  assert.ok(consultant.includes('inventory_transfers.read_own'));
  assert.equal(technician.includes('inventory_transfers.review'), false);
  assert.deepEqual(resolveRoleDefaultPermissionCodes('Encargado personalizado'), []);
});

test('admin.panel.read es independiente de permisos normales y el comodín lo concede al administrador', () => {
  const technician = resolveRoleDefaultPermissionCodes('Técnico');
  const administrator = resolveRoleDefaultPermissionCodes('Administrador');

  assert.deepEqual(splitPermissionCode('admin.panel.read'), {
    module: 'admin.panel',
    action: 'read',
  });
  assert.equal(technician.includes('admin.panel.read'), false);
  assert.equal(
    hasPermissionCode({ grantedCodes: technician, requiredCode: 'admin.panel.read' }),
    false
  );
  assert.equal(
    hasPermissionCode({ grantedCodes: administrator, requiredCode: 'admin.panel.read' }),
    true
  );
});

test('el cambio de contraseña ajena requiere permiso vigente específico', () => {
  assert.equal(canChangePassword({ actorId: 3, targetId: 3 }), true);
  assert.equal(canChangePassword({ actorId: 3, targetId: 8 }), false);
  assert.equal(
    canChangePassword({
      actorId: 3,
      targetId: 8,
      permissions: ['users.update_password'],
    }),
    true
  );
});

test('el cambio de contraseña aplica la política de registro y el flag es booleano', () => {
  assert.equal(passwordSchema.safeParse('Weak123').success, false);
  assert.equal(passwordSchema.safeParse('StrongPass123').success, true);
});

test('la creación de traslado bloquea el activo antes de revisar solicitudes pendientes', async () => {
  const calls = [];
  const tx = {
    async $queryRaw(_strings, inventoryId) {
      calls.push(['lock', inventoryId]);
    },
    bd_inventory: {
      async findUnique() {
        calls.push(['inventory']);
        return { id: 15 };
      },
    },
    inventory_transfer_requests: {
      async findFirst() {
        calls.push(['pending']);
        return null;
      },
      async create({ data }) {
        calls.push(['create', data.inventory_id]);
        return { id: 22, ...data };
      },
    },
  };
  const db = { $transaction: (callback) => callback(tx) };

  const request = await createPendingTransferRequest({
    db,
    inventoryId: 15,
    requesterId: 4,
    snapshot: { tag: 'AAUD-15' },
  });

  assert.deepEqual(calls.map(([name]) => name), ['lock', 'inventory', 'pending', 'create']);
  assert.equal(request.inventory_id, 15);
});

test('una solicitud pendiente existente devuelve conflicto sin insertar otra', async () => {
  let createCalled = false;
  const tx = {
    async $queryRaw() {},
    bd_inventory: { findUnique: async () => ({ id: 15 }) },
    inventory_transfer_requests: {
      findFirst: async () => ({ id: 22 }),
      create: async () => {
        createCalled = true;
      },
    },
  };
  const db = { $transaction: (callback) => callback(tx) };

  await assert.rejects(
    createPendingTransferRequest({
      db,
      inventoryId: 15,
      requesterId: 4,
      snapshot: {},
    }),
    { statusCode: 409 }
  );
  assert.equal(createCalled, false);
});