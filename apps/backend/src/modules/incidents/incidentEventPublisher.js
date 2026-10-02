import { getEffectivePermissionCodesForUser } from '../../common/rbac/permissions.service.js';
import { prisma } from '../../config/prisma.js';
import { canAccessIncidentRoom, canReadIncidentManagerEvents } from './incidentAccess.js';

export async function publishIncidentEvent(
  io,
  { event, incidentId, payload, managerOnly = false },
  { db = prisma, resolvePermissions = getEffectivePermissionCodesForUser } = {}
) {
  const sockets = [...(io?.of('/')?.sockets?.values?.() || [])];
  if (!sockets.length) return 0;

  const userIds = [...new Set(sockets.map((socket) => Number(socket.user?.id)).filter(Boolean))];
  const [users, incident] = await Promise.all([
    db.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, id_rol: true, active: true },
    }),
    managerOnly
      ? Promise.resolve(null)
      : db.bd_incidents.findUnique({
          where: { id: Number(incidentId) },
          select: { id_technician: true },
        }),
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const permissionEntries = await Promise.all(
    users
      .filter((user) => user.active)
      .map(async (user) => [
        user.id,
        await resolvePermissions({ userId: user.id, roleId: user.id_rol }),
      ])
  );
  const permissionsByUserId = new Map(permissionEntries);
  let delivered = 0;

  for (const socket of sockets) {
    const userId = Number(socket.user?.id);
    const user = userById.get(userId);
    if (!user?.active) {
      socket.disconnect(true);
      continue;
    }

    const permissions = permissionsByUserId.get(userId) || [];
    const authorized = managerOnly
      ? canReadIncidentManagerEvents(permissions)
      : canAccessIncidentRoom({ permissions, userId, incident });

    if (authorized) {
      socket.emit(event, payload);
      delivered += 1;
    }
  }

  return delivered;
}