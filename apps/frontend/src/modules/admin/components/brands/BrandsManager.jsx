import { useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Pagination from '../../../../shared/components/ui/Pagination';
import BrandsTable from './BrandsTable';

export default function BrandsManager() {
  const [brands, setbrands] = useState([]);
  const [newBrand, setnewBrand] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const API_URL = `/api/brands`;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState('');

  //  Cargar marcas desde backend
  const fetchbrands = async () => {
    try {
      const res = await api.get(API_URL);
      setbrands(res.data);
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
    fetchbrands();
  }, []);

  //  Agregar nueva marca
  const addBrand = async () => {
    if (!newBrand.trim()) return;
    try {
      await api.post(`${API_URL}`, {
        name: newBrand,
      });
      setnewBrand('');
      fetchbrands();
      showSuccess('Marca agregada correctamente');
    } catch (err) {
      console.error('Error al agregar marca:', err);
      showError(err.response?.data?.message || 'Error al agregar marca.');
    }
  };

  //  Iniciar edición
  const editBrand = (id, name) => {
    setEditingId(id);
    setEditingName(name);
  };

  //  Guardar edición
  const saveBrand = async (id) => {
    if (!editingName.trim()) return;
    try {
      await api.put(`${API_URL}/${id}`, { name: editingName });
      setEditingId(null);
      setEditingName('');
      fetchbrands();
      showSuccess('Marca actualizada correctamente');
    } catch (err) {
      console.error('Error al guardar marca:', err);
      showError(err.response?.data?.message || 'Error al guardar marca.');
    }
  };

  const deleteBrand = async (brand) => {
    if (
      !window.confirm(
        `¿Está seguro de que desea eliminar la marca "${brand.name}"?`
      )
    )
      return;

    try {
      await api.delete(`${API_URL}/${brand.id}`);
      if (editingId === brand.id) {
        setEditingId(null);
        setEditingName('');
      }
      fetchbrands();
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
  const filteredBrands = brands.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedBrands = [...filteredBrands].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBrands = sortedBrands.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gestión de Marcas</h2>
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
        addBrand={addBrand}
        newBrand={newBrand}
        saveBrand={saveBrand}
        deleteBrand={deleteBrand}
        editingId={editingId}
        editingName={editingName}
        setnewBrand={setnewBrand}
        setEditingName={setEditingName}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
