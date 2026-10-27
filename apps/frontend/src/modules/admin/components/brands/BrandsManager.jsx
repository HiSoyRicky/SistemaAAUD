// BrandsManager.jsx

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Modal from '../../../../shared/components/ui/Modal';
import Pagination from '../../../../shared/components/ui/Pagination';
import useAuth from '../../../../shared/hooks/useAuth';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';
import BrandsTable from './BrandsTable';

export default function BrandsManager() {
  const { hasPermission } = useAuth();
  const canCreateBrand = hasPermission('brands.create');
  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const API_URL = `/api/brands`;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState('');

  //  Cargar marcas desde backend
  const fetchBrands = async () => {
    try {
      const res = await api.get(API_URL);
      setBrands(res.data);
    } catch (err) {
      console.error('Error al cargar marcas:', err);
    }
  };

  const showSuccess = (text) => {
    setSuccessMessage(text);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (text) => {
    setErrorMessage(text);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  //  Agregar nueva marca
  const addBrand = async () => {
    const name = newBrand.trim();

    if (!name || saving) return;

    if (duplicateBrand) {
      setFormError(
        'Esta marca ya existe en el catálogo. No puedes crear ni solicitar una marca duplicada.'
      );
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (canCreateBrand) {
        await api.post(API_URL, { name });
      } else {
        await api.post('/api/creation-requests', {
          type: 'BRAND',
          payload: { name },
        });
      }

      setNewBrand('');
      setFormOpen(false);

      if (canCreateBrand) {
        await fetchBrands();
      }

      showSuccess(
        canCreateBrand
          ? 'Marca agregada correctamente'
          : 'Solicitud enviada al administrador para revisión'
      );
    } catch (err) {
      console.error('Error al agregar marca:', err);

      setFormError(err.response?.data?.message || 'Error al agregar marca.');
    } finally {
      setSaving(false);
    }
  };

  //  Iniciar edición
  const editBrand = (id, name) => {
    setEditingId(id);
    setEditingName(name);
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setEditingName('');
    setNewBrand('');
    setFormError('');
  };

  //  Guardar edición
  const saveBrand = async (id) => {
    if (!editingName.trim() || saving) return;
    setSaving(true);
    setFormError('');
    try {
      await api.put(`${API_URL}/${id}`, { name: editingName });
      setEditingId(null);
      setEditingName('');
      setFormOpen(false);
      fetchBrands();
      showSuccess('Marca actualizada correctamente');
    } catch (err) {
      console.error('Error al guardar marca:', err);
      setFormError(err.response?.data?.message || 'Error al guardar marca.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBrand = async (brand) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar la marca "${brand.name}"?`)) return;

    try {
      await api.delete(`${API_URL}/${brand.id}`);
      if (editingId === brand.id) {
        setEditingId(null);
        setEditingName('');
      }
      fetchBrands();
      showSuccess('Marca eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar marca:', err);
      showError(err.response?.data?.message || 'Error al eliminar marca.');
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Filtrado por búsqueda
  const normalizedSearch = normalizeCatalogName(search);
  const filteredBrands = brands.filter((brand) =>
    normalizeCatalogName(brand.name).includes(normalizedSearch)
  );

  const sortedBrands = [...filteredBrands].sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBrands = sortedBrands.slice(startIndex, endIndex);
  const normalizedNewBrand = normalizeCatalogName(newBrand);

  const similarBrands = normalizedNewBrand
    ? brands.filter((brand) => normalizeCatalogName(brand.name).includes(normalizedNewBrand))
    : [];

  const duplicateBrand = brands.some(
    (brand) => normalizeCatalogName(brand.name) === normalizedNewBrand
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Gestión de Marcas</h2>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setNewBrand('');
            setFormError('');
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} /> {canCreateBrand ? 'Nueva marca' : 'Solicitar marca'}
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
      <div className="flex gap-1 mb-4">
        <input
          type="text"
          placeholder="Buscar marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2 py-1 border rounded"
        />
      </div>

      <BrandsTable
        brands={paginatedBrands}
        editBrand={editBrand}
        deleteBrand={deleteBrand}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={
          editingId ? 'Editar marca' : canCreateBrand ? 'Nueva marca' : 'Solicitar nueva marca'
        }
        size="md"
        showCloseButton={!saving}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (editingId) saveBrand(editingId);
            else addBrand();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-500">
            {editingId
              ? 'Actualiza el nombre de la marca.'
              : canCreateBrand
                ? 'Agrega una marca al catálogo.'
                : 'Envía la marca para revisión del administrador.'}
          </p>
          <label htmlFor="brand-name" className="block text-sm font-semibold text-slate-700">
            Nombre de la marca
          </label>
          <input
            id="brand-name"
            autoFocus
            required
            maxLength={50}
            value={editingId ? editingName : newBrand}
            onChange={(event) =>
              editingId ? setEditingName(event.target.value) : setNewBrand(event.target.value)
            }
            disabled={saving}
            placeholder="Ej. Kyocera"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {!editingId && duplicateBrand && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
            >
              Esta marca ya existe en el catálogo. No es necesario solicitarla nuevamente.
            </p>
          )}
          {!editingId && similarBrands.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Marcas similares existentes</p>
              <ul className="mt-1 list-inside list-disc">
                {similarBrands.slice(0, 8).map((brand) => (
                  <li key={brand.id}>{brand.name}</li>
                ))}
              </ul>
            </div>
          )}
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {formError}
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
              disabled={
                saving ||
                !(editingId ? editingName : newBrand).trim() ||
                (!editingId && duplicateBrand)
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? 'Guardando...'
                : editingId
                  ? 'Guardar cambios'
                  : canCreateBrand
                    ? 'Crear marca'
                    : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
