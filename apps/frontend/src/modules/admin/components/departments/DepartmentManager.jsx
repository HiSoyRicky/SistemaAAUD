import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Modal from '../../../../shared/components/ui/Modal';
import Pagination from '../../../../shared/components/ui/Pagination';
import useAuth from '../../../../shared/hooks/useAuth';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';
import DepartmentsTable from './DepartmentsTable';

export default function DepartmentsManager() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('departments.create');
  const canUpdate = hasPermission('departments.update');
  const canDelete = hasPermission('departments.delete');
  const [departments, setDepartments] = useState([]);
  const [ubications, setUbications] = useState([]);
  const [newName, setNewName] = useState('');
  const [newUbication, setNewUbication] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingUbication, setEditingUbication] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 10;
  const API_URL = '/api/departments';

  const fetchDepartments = async () => {
    try {
      const response = await api.get(API_URL);
      setDepartments([...response.data].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error al cargar departamentos');
    }
  };
  const fetchUbications = async () => {
    try {
      const response = await api.get('/api/ubications');
      setUbications(response.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error al cargar ubicaciones');
    }
  };
  useEffect(() => { void fetchDepartments(); void fetchUbications(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    window.setTimeout(() => setSuccessMessage(''), 3000);
  };
  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setEditingName('');
    setEditingUbication('');
    setNewName('');
    setNewUbication('');
    setFormError('');
  };
  const closeForm = () => { if (!saving) resetForm(); };
  const openCreate = () => { resetForm(); setFormOpen(true); };
  const editDepartment = (department) => {
    setEditingId(department.id);
    setEditingName(department.name);
    setEditingUbication(String(department.id_ubication));
    setFormError('');
    setFormOpen(true);
  };
  const save = async (event) => {
    event.preventDefault();
    const name = (editingId ? editingName : newName).trim();
    const locationId = editingId ? editingUbication : newUbication;
    if (!name || !locationId || saving) return;
    const duplicate = departments.find((item) =>
      Number(item.id_ubication) === Number(locationId) &&
      normalizeCatalogName(item.name) === normalizeCatalogName(name) && item.id !== editingId
    );
    if (duplicate) {
      setFormError(`Ya existe el departamento “${duplicate.name}” en esa ubicación.`);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { name, id_ubication: Number(locationId) };
      if (editingId) await api.put(`${API_URL}/${editingId}`, payload);
      else await api.post(API_URL, payload);
      await fetchDepartments();
      resetForm();
      showSuccess(editingId ? 'Departamento actualizado correctamente' : 'Departamento creado correctamente');
    } catch (error) {
      setFormError(error.response?.data?.message || 'No se pudo guardar el departamento.');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (department) => {
    if (!window.confirm(`¿Eliminar el departamento “${department.name}”?`)) return;
    try {
      await api.delete(`${API_URL}/${department.id}`);
      await fetchDepartments();
      showSuccess(`Departamento “${department.name}” eliminado correctamente`);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'No se pudo eliminar el departamento.');
    }
  };

  const normalizedSearch = normalizeCatalogName(search);
  const filtered = departments.filter((item) => normalizeCatalogName(`${item.name} ${item.ubication_name}`).includes(normalizedSearch));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const locationOptions = [...ubications].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Gestión de Departamentos</h2>
        {canCreate && <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} /> Nuevo departamento</button>}
      </div>
      {successMessage && <div role="status" className="rounded border border-green-300 bg-green-100 px-4 py-2 text-green-800">{successMessage}</div>}
      {errorMessage && <div role="alert" className="rounded border border-red-300 bg-red-100 px-4 py-2 text-red-800">{errorMessage}</div>}
      <input type="search" placeholder="Buscar departamento o ubicación..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:max-w-sm" />
      <DepartmentsTable departments={paginated} currentPage={currentPage} itemsPerPage={itemsPerPage} canUpdate={canUpdate} canDelete={canDelete} editDepartment={editDepartment} handleDelete={handleDelete} />
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      <Modal open={formOpen} onClose={closeForm} title={editingId ? 'Editar departamento' : 'Nuevo departamento'} size="md" showCloseButton={!saving}>
        <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-slate-500">{editingId ? 'Actualiza el nombre y la ubicación del departamento.' : 'Agrega un departamento y asígnalo a una ubicación.'}</p>
          {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <label className="block text-sm font-semibold text-slate-700">Nombre del departamento
            <input required maxLength={100} autoFocus value={editingId ? editingName : newName} onChange={(event) => editingId ? setEditingName(event.target.value) : setNewName(event.target.value)} disabled={saving} placeholder="Ej. Administración" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Ubicación
            <select required value={editingId ? editingUbication : newUbication} onChange={(event) => editingId ? setEditingUbication(event.target.value) : setNewUbication(event.target.value)} disabled={saving} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">
              <option value="">Seleccione una ubicación</option>
              {locationOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" disabled={saving} onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
            <button type="submit" disabled={saving || !(editingId ? editingName : newName).trim() || !(editingId ? editingUbication : newUbication)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear departamento'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
