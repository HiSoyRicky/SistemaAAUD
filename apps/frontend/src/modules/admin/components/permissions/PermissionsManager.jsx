import {
  MapPinned,
  RotateCcw,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import useAuth from '../../../../shared/hooks/useAuth';
import PermissionsApi from '../../services/permissions.api';

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Error inesperado'
  );
}

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase();
}

function setFromList(list = []) {
  return new Set(list.map((item) => normalizeCode(item)).filter(Boolean));
}

function formatLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const MODULE_LABELS = {
  incidents: 'Incidencias',
  inventory: 'Inventario',
  toner_movements: 'Movimientos de tóner',
  toners: 'Tóneres',
  users: 'Usuarios',
  roles: 'Roles',
  brands: 'Marcas',
  devices: 'Equipos',
  models: 'Modelos',
  departments: 'Departamentos',
  ubications: 'Ubicaciones',
  status: 'Estados',
  permissions: 'Permisos',
};

const ACTION_DETAILS = {
  read: ['Ver', 'Permite consultar registros del módulo.'],
  create: ['Crear', 'Permite registrar nuevos elementos.'],
  update: [
    'Editar completamente',
    'Permite modificar todos los campos disponibles.',
  ],
  delete: ['Eliminar', 'Permite eliminar registros.'],
  update_password: [
    'Cambiar contraseñas',
    'Permite actualizar contraseñas de usuarios.',
  ],
  assign: ['Asignar permisos', 'Permite cambiar permisos de roles y usuarios.'],
  update_location: [
    'Editar ubicación',
    'Permite cambiar únicamente la ubicación del equipo.',
  ],
  update_department: [
    'Editar departamento',
    'Permite cambiar únicamente el departamento del equipo.',
  ],
  update_assignee: [
    'Editar usuario asignado',
    'Permite cambiar únicamente el usuario responsable del equipo.',
  ],
};

const LIMITED_INVENTORY_PERMISSIONS = [
  'inventory.update_location',
  'inventory.update_department',
  'inventory.update_assignee',
];

function getModuleLabel(moduleName) {
  return MODULE_LABELS[moduleName] || formatLabel(moduleName);
}

function getActionDetail(actionName) {
  return (
    ACTION_DETAILS[actionName] || [
      formatLabel(actionName),
      'Controla esta acción dentro del módulo.',
    ]
  );
}

function toSortedArray(setValue) {
  return [...setValue].sort((a, b) => a.localeCompare(b));
}

export default function PermissionsManager() {
  const { loggedUserId } = useAuth();

  const [mode, setMode] = useState('role');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [rolePermissionSet, setRolePermissionSet] = useState(new Set());

  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserMeta, setSelectedUserMeta] = useState(null);
  const [userRolePermissionSet, setUserRolePermissionSet] = useState(new Set());
  const [userGrantSet, setUserGrantSet] = useState(new Set());
  const [userDenySet, setUserDenySet] = useState(new Set());

  const groupedPermissions = useMemo(() => {
    const groups = new Map();

    permissionsCatalog.forEach((permission) => {
      const key = permission.module;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(permission);
    });

    return [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([module, permissions]) => ({
        module,
        permissions: [...permissions].sort((a, b) =>
          a.action.localeCompare(b.action)
        ),
      }));
  }, [permissionsCatalog]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) => {
      const fullName = String(user.nombre_completo || '').toLowerCase();
      const username = String(user.username || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();

      return (
        fullName.includes(term) ||
        username.includes(term) ||
        email.includes(term)
      );
    });
  }, [users, userSearch]);

  useEffect(() => {
    if (!filteredUsers.length) {
      setSelectedUserId(null);
      setSelectedUserMeta(null);
      return;
    }

    const selectedUserIsVisible = filteredUsers.some(
      (user) => Number(user.id) === Number(selectedUserId)
    );

    if (!selectedUserIsVisible) {
      setSelectedUserId(Number(filteredUsers[0].id));
    }
  }, [filteredUsers, selectedUserId]);

  const liveUserEffectiveSet = useMemo(() => {
    const effective = new Set(userRolePermissionSet);

    userGrantSet.forEach((code) => effective.add(code));
    userDenySet.forEach((code) => effective.delete(code));

    return effective;
  }, [userRolePermissionSet, userGrantSet, userDenySet]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      setError('');

      try {
        const [overview, usersData] = await Promise.all([
          PermissionsApi.fetchOverview(),
          PermissionsApi.fetchUsers(),
        ]);

        const nextPermissions = Array.isArray(overview?.permissions)
          ? overview.permissions
          : [];
        const nextRoles = Array.isArray(overview?.roles) ? overview.roles : [];
        const nextUsers = Array.isArray(usersData) ? usersData : [];

        setPermissionsCatalog(nextPermissions);
        setRoles(nextRoles);
        setUsers(nextUsers);

        if (nextRoles.length > 0) {
          setSelectedRoleId(Number(nextRoles[0].id));
        }

        if (nextUsers.length > 0) {
          setSelectedUserId(Number(nextUsers[0].id));
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) {
      return;
    }

    const loadRolePermissions = async () => {
      setLoadingRole(true);
      setError('');

      try {
        const data = await PermissionsApi.fetchRolePermissions(selectedRoleId);
        setSelectedRoleName(String(data?.name || ''));
        setRolePermissionSet(setFromList(data?.permissions || []));
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoadingRole(false);
      }
    };

    loadRolePermissions();
  }, [selectedRoleId]);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const loadUserPermissions = async () => {
      setLoadingUser(true);
      setError('');

      try {
        const data = await PermissionsApi.fetchUserPermissions(selectedUserId);

        setSelectedUserMeta(data?.user || null);
        setUserRolePermissionSet(setFromList(data?.rolePermissions || []));
        setUserGrantSet(setFromList(data?.userOverrides?.grants || []));
        setUserDenySet(setFromList(data?.userOverrides?.denies || []));
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserPermissions();
  }, [selectedUserId]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timeoutId = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timeoutId);
  }, [success]);

  const handleRoleToggle = (code) => {
    setRolePermissionSet((previous) => {
      const next = new Set(previous);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = toSortedArray(rolePermissionSet);
      const result = await PermissionsApi.updateRolePermissions(
        selectedRoleId,
        payload
      );

      const nextPermissions = setFromList(result?.permissions || []);
      setRolePermissionSet(nextPermissions);

      setRoles((previous) =>
        previous.map((role) =>
          Number(role.id) === Number(selectedRoleId)
            ? { ...role, permissions: toSortedArray(nextPermissions) }
            : role
        )
      );

      setSuccess('Permisos del rol actualizados correctamente');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const updateUserOverride = (code, value) => {
    setUserGrantSet((previous) => {
      const next = new Set(previous);
      next.delete(code);
      if (value === 'allow') {
        next.add(code);
      }
      return next;
    });

    setUserDenySet((previous) => {
      const next = new Set(previous);
      next.delete(code);
      if (value === 'deny') {
        next.add(code);
      }
      return next;
    });
  };

  const applyLimitedInventoryPreset = async () => {
    if (!selectedUserId) {
      return;
    }

    const nextGrants = new Set(userGrantSet);
    LIMITED_INVENTORY_PERMISSIONS.forEach((code) => nextGrants.add(code));
    nextGrants.delete('inventory.update');

    const nextDenies = new Set(userDenySet);
    LIMITED_INVENTORY_PERMISSIONS.forEach((code) => nextDenies.delete(code));
    nextDenies.add('inventory.update');

    setSaving(true);
    setError('');

    try {
      const result = await PermissionsApi.updateUserPermissions(
        selectedUserId,
        {
          grants: toSortedArray(nextGrants),
          denies: toSortedArray(nextDenies),
        }
      );

      setSelectedUserMeta(result?.user || selectedUserMeta);
      setUserGrantSet(setFromList(result?.userOverrides?.grants || []));
      setUserDenySet(setFromList(result?.userOverrides?.denies || []));
      setSuccess(
        'Permisos guardados. El técnico puede editar Ubicación, Departamento y Usuario.'
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const clearUserOverrides = () => {
    setUserGrantSet(new Set());
    setUserDenySet(new Set());
  };

  const saveUserOverrides = async () => {
    if (!selectedUserId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        grants: toSortedArray(userGrantSet),
        denies: toSortedArray(userDenySet),
      };

      const result = await PermissionsApi.updateUserPermissions(
        selectedUserId,
        payload
      );

      setSelectedUserMeta(result?.user || selectedUserMeta);
      setUserGrantSet(setFromList(result?.userOverrides?.grants || []));
      setUserDenySet(setFromList(result?.userOverrides?.denies || []));

      setSuccess('Permisos del usuario actualizados correctamente');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return <div className="p-4">Cargando permisos...</div>;
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Gestión de Permisos</h2>
        <p className="text-sm text-gray-600">
          Define la base por rol y crea excepciones para usuarios específicos.
          Los permisos denegados tienen prioridad sobre los heredados.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('role')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === 'role'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Por rol
        </button>

        <button
          type="button"
          onClick={() => setMode('user')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <UserCog className="h-4 w-4" />
          Por usuario
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      {mode === 'role' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
            <div className="min-w-[260px] flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                value={selectedRoleId || ''}
                onChange={(event) =>
                  setSelectedRoleId(Number(event.target.value))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={saveRolePermissions}
              disabled={saving || loadingRole || !selectedRoleId}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar permisos del rol'}
            </button>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Rol seleccionado: {selectedRoleName || 'N/D'}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {groupedPermissions.map((group) => (
                <article
                  key={group.module}
                  className="rounded-lg border bg-gray-50 p-3"
                >
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">
                    {getModuleLabel(group.module)}
                  </h3>

                  <div className="space-y-2">
                    {group.permissions.map((permission) => {
                      const code = normalizeCode(permission.code);
                      const checked = rolePermissionSet.has(code);
                      const [actionLabel, actionDescription] = getActionDetail(
                        permission.action
                      );

                      return (
                        <label
                          key={code}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm"
                        >
                          <span>
                            <span className="block font-medium">
                              {actionLabel}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {actionDescription}
                            </span>
                          </span>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleRoleToggle(code)}
                            className="h-4 w-4"
                          />
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'user' && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Buscar usuario
                </label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Nombre, usuario o correo"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <select
                  value={
                    filteredUsers.some(
                      (user) => Number(user.id) === Number(selectedUserId)
                    )
                      ? selectedUserId
                      : ''
                  }
                  onChange={(event) =>
                    setSelectedUserId(Number(event.target.value))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {!filteredUsers.length && (
                    <option value="">No se encontraron usuarios</option>
                  )}
                  {filteredUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre_completo || user.username} ({user.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span>
                Usuario:{' '}
                <strong>
                  {selectedUserMeta?.nombre_completo ||
                    selectedUserMeta?.username ||
                    'N/D'}
                </strong>
              </span>
              <span>
                Rol: <strong>{selectedUserMeta?.role?.name || 'N/D'}</strong>
              </span>
              {Number(selectedUserId) === Number(loggedUserId) && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                  Editando tu propio usuario
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyLimitedInventoryPreset}
                  disabled={saving || loadingUser || !selectedUserId}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MapPinned className="h-4 w-4" />
                  Permitir solo reasignación de inventario
                </button>

                <button
                  type="button"
                  onClick={clearUserOverrides}
                  disabled={loadingUser || !selectedUserId}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restablecer a permisos del rol
                </button>

                <button
                  type="button"
                  onClick={saveUserOverrides}
                  disabled={saving || loadingUser || !selectedUserId}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar permisos del usuario'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Este botón guarda inmediatamente la configuración y deniega la
                edición completa.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                Heredado del rol: {userRolePermissionSet.size}
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                Overrides permitir: {userGrantSet.size}
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                Overrides denegar: {userDenySet.size}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                Permisos efectivos: {liveUserEffectiveSet.size}
              </span>
            </div>

            <div className="space-y-4">
              {groupedPermissions.map((group) => (
                <article
                  key={group.module}
                  className="rounded-lg border bg-gray-50 p-3"
                >
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">
                    {getModuleLabel(group.module)}
                  </h3>

                  <div className="space-y-2">
                    {group.permissions.map((permission) => {
                      const code = normalizeCode(permission.code);
                      const roleHasPermission = userRolePermissionSet.has(code);
                      const effectiveHasPermission =
                        liveUserEffectiveSet.has(code);
                      const [actionLabel, actionDescription] = getActionDetail(
                        permission.action
                      );

                      const overrideValue = userGrantSet.has(code)
                        ? 'allow'
                        : userDenySet.has(code)
                          ? 'deny'
                          : 'inherit';

                      return (
                        <div
                          key={code}
                          className="grid grid-cols-1 gap-2 rounded-md bg-white px-3 py-2 text-sm md:grid-cols-[1.4fr_0.9fr_1fr_0.9fr] md:items-center"
                        >
                          <div>
                            <div className="font-medium">{actionLabel}</div>
                            <div className="text-xs text-gray-500">
                              {actionDescription}
                            </div>
                          </div>

                          <div>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                roleHasPermission
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Rol: {roleHasPermission ? 'Sí' : 'No'}
                            </span>
                          </div>

                          <div>
                            <select
                              value={overrideValue}
                              onChange={(event) =>
                                updateUserOverride(code, event.target.value)
                              }
                              className="w-full rounded-md border px-2 py-1 text-xs"
                            >
                              <option value="inherit">Heredar</option>
                              <option value="allow">Permitir</option>
                              <option value="deny">Denegar</option>
                            </select>
                          </div>

                          <div>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                effectiveHasPermission
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Efectivo: {effectiveHasPermission ? 'Sí' : 'No'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
