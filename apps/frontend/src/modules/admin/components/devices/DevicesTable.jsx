import { Plus } from 'lucide-react';
import { useState } from 'react';
import ActionButton from '../../../../shared/components/ui/ActionButton';
import Modal from '../../../../shared/components/ui/Modal';
import Pagination from '../../../../shared/components/ui/Pagination';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';

export default function DevicesTable({
  currentPage,
  itemsPerPage,
  editingId,
  editingName,
  setEditingId,
  setEditingName,
  saveDevice,
  totalPages,
  search,
  setSearch,
  paginatedDevices,
  newDevice,
  setNewDevice,
  addDevice,
  addActionLabel = 'Agregar',
  suggestedDevices = [],
  successMessage,
  setCurrentPage,
  editDevice,
  errorMessage,
  setErrorMessage,
  deleteDevice,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentName = editingId ? editingName : newDevice;
  const normalizedName = normalizeCatalogName(currentName);

  const duplicateDevice = normalizedName
    ? suggestedDevices.find(
        (device) =>
          Number(device.id) !== Number(editingId) &&
          normalizeCatalogName(device.name) === normalizedName
      )
    : null;
  const closeForm = () => {
    if (!saving) {
      setFormOpen(false);
      setEditingId(null);
      setNewDevice('');
      setErrorMessage('');
    }
  };
  const submitForm = async (event) => {
    event.preventDefault();

    if (saving || !currentName.trim()) return;

    if (duplicateDevice) {
      setErrorMessage(`El activo "${duplicateDevice.name}" ya existe en el catálogo.`);
      return;
    }

    setSaving(true);

    try {
      const saved = editingId ? await saveDevice(editingId) : await addDevice();

      if (saved) {
        setFormOpen(false);
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gestión de Activos</h2>
        <button
          type="button"
          onClick={() => {
            setErrorMessage('');
            setEditingId(null);
            setNewDevice('');
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          {addActionLabel === 'Solicitar creación' ? addActionLabel : 'Crear activo'}
        </button>
      </div>

      {successMessage && (
        <div className="px-4 py-2 text-green-800 bg-green-100 border border-green-300 rounded">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="px-4 py-2 text-red-700 bg-red-100 border border-red-400 rounded">
          {errorMessage}
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar activo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2 py-1 border rounded"
        />
      </div>

      {/* Tabla */}
      <div className="max-w-full overflow-x-auto" role="region" aria-label="Tabla de resultados" tabIndex={0}>
      <table className="w-full min-w-[36rem] text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-1 text-center border">#</th>
            <th className="px-3 py-1 text-left border">Nombre</th>
            <th className="px-3 py-1 text-center border">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {paginatedDevices.map((d, index) => (
            <tr key={d.id}>
              {/* Enumeración consecutiva */}
              <td className="px-3 py-1 text-center border">
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>

              <td className="px-3 py-1 border">{d.name}</td>
              <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                <>
                  <ActionButton
                    type={'edit'}
                    title="Editar activo"
                    onClick={() => {
                      setErrorMessage('');
                      editDevice(d.id, d.name);
                      setFormOpen(true);
                    }}
                  ></ActionButton>
                  <ActionButton
                    type="delete"
                    title="Eliminar activo"
                    onClick={() => deleteDevice(d.id)}
                  />
                </>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={
          editingId
            ? 'Editar activo'
            : addActionLabel === 'Solicitar creación'
              ? 'Solicitar nuevo activo'
              : 'Crear activo'
        }
        size="md"
        showCloseButton={!saving}
      >
        <form onSubmit={submitForm} className="space-y-4">
          <p className="text-sm text-slate-500">
            {editingId
              ? 'Actualiza el nombre del activo.'
              : 'Introduce el nombre del activo que deseas agregar al catálogo.'}
          </p>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="device-name">
            Nombre del activo
          </label>
          <input
            id="device-name"
            autoFocus
            required
            maxLength={50}
            value={editingId ? editingName : newDevice}
            onChange={(event) =>
              editingId ? setEditingName(event.target.value) : setNewDevice(event.target.value)
            }
            placeholder="Ej. Impresora"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {duplicateDevice && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
            >
              El activo "{duplicateDevice.name}" ya existe. No puedes registrar otro activo con el
              mismo nombre.
            </p>
          )}
          {!editingId && suggestedDevices.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Activos similares existentes</p>
              <ul className="mt-1 max-h-28 overflow-y-auto">
                {suggestedDevices.slice(0, 8).map((device) => (
                  <li key={device.id}>{device.name}</li>
                ))}
              </ul>
            </div>
          )}
          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !currentName.trim() || Boolean(duplicateDevice)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : addActionLabel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
