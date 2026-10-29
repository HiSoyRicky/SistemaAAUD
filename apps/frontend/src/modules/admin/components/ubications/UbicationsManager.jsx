import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/shared/api/apiClient';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';
import useAuth from '@/shared/hooks/useAuth';
import normalizeCatalogName from '@/shared/utils/normalizeCatalogName';
import UbicationsTable from './UbicationsTable';

export default function UbicationsManager() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('ubications.create');
  const canUpdate = hasPermission('ubications.update');
  const [ubications, setUbications] = useState([]);
  const [newUbication, setNewUbication] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 10;
  const API_URL = '/api/ubications';

  const fetchUbications = async () => {
    try {
      const res = await api.get(API_URL);
      setUbications(res.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error al cargar ubicaciones');
    }
  };

  useEffect(() => { void fetchUbications(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    window.setTimeout(() => setSuccessMessage(''), 3000);
  };
  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setEditingName('');
    setNewUbication('');
    setFormError('');
  };
  const openCreate = () => {
    setEditingId(null);
    setEditingName('');
    setNewUbication('');
    setFormError('');
    setFormOpen(true);
  };
  const editUbication = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setFormError('');
    setFormOpen(true);
  };
  const save = async (event) => {
    event.preventDefault();
    const name = (editingId ? editingName : newUbication).trim();
    if (!name || saving) return;
    const duplicate = ubications.find((item) =>
      normalizeCatalogName(item.name) === normalizeCatalogName(name) && item.id !== editingId
    );
    if (duplicate) {
      setFormError(`Ya existe una ubicación con el nombre “${duplicate.name}”.`);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingId) await api.put(`${API_URL}/${editingId}`, { name });
      else await api.post(API_URL, { name });
      await fetchUbications();
      closeForm();
      showSuccess(editingId ? 'Ubicación actualizada correctamente' : 'Ubicación creada correctamente');
    } catch (error) {
      setFormError(error.response?.data?.message || 'No se pudo guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  const normalizedSearch = normalizeCatalogName(search);
  const filtered = ubications.filter((item) => normalizeCatalogName(item.name).includes(normalizedSearch));
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Gestión de Ubicaciones</h2>
        {canCreate && <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} /> Nueva ubicación</button>}
      </div>
      {successMessage && <div role="status" className="rounded border border-green-300 bg-green-100 px-4 py-2 text-green-800">{successMessage}</div>}
      {errorMessage && <div role="alert" className="rounded border border-red-300 bg-red-100 px-4 py-2 text-red-800">{errorMessage}</div>}
      <input type="search" placeholder="Buscar ubicación..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:max-w-sm" />
      <UbicationsTable ubications={paginated} currentPage={currentPage} itemsPerPage={itemsPerPage} canUpdate={canUpdate} editUbication={editUbication} />
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      <Modal open={formOpen} onClose={closeForm} title={editingId ? 'Editar ubicación' : 'Nueva ubicación'} size="md" showCloseButton={!saving}>
        <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-slate-500">{editingId ? 'Actualiza el nombre de la ubicación.' : 'Agrega una ubicación al catálogo.'}</p>
          {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <label htmlFor="ubication-name" className="block text-sm font-semibold text-slate-700">Nombre de la ubicación</label>
          <input id="ubication-name" autoFocus required maxLength={100} value={editingId ? editingName : newUbication} onChange={(event) => editingId ? setEditingName(event.target.value) : setNewUbication(event.target.value)} disabled={saving} placeholder="Ej. Sede central" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" disabled={saving} onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
            <button type="submit" disabled={saving || !(editingId ? editingName : newUbication).trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear ubicación'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
