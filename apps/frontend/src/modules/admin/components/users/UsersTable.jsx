// UsersTable.jsx

import ActionButton from '../../../../shared/components/ui/ActionButton';

function isAdministratorRoleName(name) {
  return (
    String(name || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') === 'administrador'
  );
}

export default function UsersTable({
  users,
  roles,
  editUser,
  handleResetPassword,
  currentPage = 1,
  itemsPerPage = 10,
  setCurrentPage,
  setShowForm,
  showForm,
  search,
  setSearch,
  message,
  messageType,
}) {
  return (
    <div className="space-y-3">
      {/* Título + botón */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
        >
          {showForm ? 'Ocultar formulario' : 'Crear nuevo usuario'}
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, usuario, correo o rol..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {message && (
        <div
          className={`px-4 py-2 border rounded ${
            messageType === 'error'
              ? 'text-red-700 bg-red-100 border-red-400'
              : 'text-green-800 bg-green-100 border-green-300'
          }`}
        >
          {message}
        </div>
      )}

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-center border">#</th>
            <th className="p-2 border">Nombre completo</th>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Ubicación</th>
            <th className="p-2 border">Departamento</th>
            <th className="p-2 border">Correo</th>
            <th className="p-2 border">Rol</th>
            <th className="p-2 text-center border">Activo</th>
            <th className="p-2 text-center border">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u, index) => {
            const roleName = roles.find((r) => r.id === u.id_rol)?.name || 'Desconocido';
            const isProtected = isAdministratorRoleName(roleName);
            return (
            <tr key={u.id} className="hover:bg-gray-50">
              {/* Enumeración consecutiva considerando la página */}
              <td className="p-2 text-center border">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>
              <td className="p-2 border">{u.nombre_completo}</td>
              <td className="p-2 border">{u.username}</td>
              <td className="p-2 border">{u.ubications?.name || '-'}</td>
              <td className="p-2 border">{u.departments?.name ?? '-'}</td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">
                {roleName}
                {isProtected && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    Protegido
                  </span>
                )}
              </td>
              <td className="p-2 text-center border">{u.active ? 'Sí' : 'No'}</td>
              <td className="flex justify-center gap-1 p-2 border">
                <ActionButton
                  type={'edit'}
                  title={isProtected ? 'El usuario Administrador no puede editarse' : 'Editar usuario'}
                  disabled={isProtected}
                  onClick={() => editUser(u)}
                ></ActionButton>
                <ActionButton
                  type={'reset'}
                  title="Restablecer contraseña"
                  onClick={() => handleResetPassword(u)}
                ></ActionButton>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
