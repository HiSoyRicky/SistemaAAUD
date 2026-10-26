// ModelsManager.jsx

import { useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Pagination from '../../../../shared/components/ui/Pagination';
import ModelsTable from './ModelsTable';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';
import useAuth from '../../../../shared/hooks/useAuth';

export default function ModelsManager() {
  const { hasPermission } = useAuth();
  const canCreateModel = hasPermission('models.create');
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [devices, setDevices] = useState([]);

  const [newModel, setNewModel] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [catalogType, setCatalogType] = useState('TECHNOLOGY');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingBrand, setEditingBrand] = useState('');
  const [editingDevice, setEditingDevice] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState('');

  const availableBrands = brands;

  const API_URL = `/api/models`;

  // Cargar modelos desde backend
  const fetchModels = async () => {
    try {
      const res = await api.get(API_URL);
      setModels(res.data);
    } catch (err) {
      console.error('Error al cargar modelos:', err);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await api.get(`/api/devices`);
      setDevices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get(`/api/brands`);
      setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchBrands();
    fetchDevices();
  }, []);

  //  Agregar nuevo modelo
  const addModel = async () => {
    if (!newModel.trim() || !selectedBrand || (catalogType === 'TECHNOLOGY' && !selectedDevice)) return;
    const duplicate = duplicateModels.find((model) => normalizeCatalogName(model.name) === normalizeCatalogName(newModel));
    if (duplicate) {
      setSuccessMessage('');
      setErrorMessage(`Ya existe un modelo equivalente: ${duplicate.name}`);
      return;
    }
    try {
      const payload = {
        name: newModel,
        id_brand: Number(selectedBrand),
        id_device: catalogType === 'VEHICLE' ? null : Number(selectedDevice),
      };
      if (canCreateModel) await api.post(`/api/models`, payload);
      else await api.post('/api/creation-requests', { type: 'MODEL', payload });
      setNewModel('');
      setSelectedBrand('');
      setSelectedDevice('');
      if (canCreateModel) fetchModels();
      setErrorMessage('');
      setSuccessMessage(canCreateModel ? 'Modelo agregado correctamente' : 'Solicitud enviada al administrador para revisión');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al agregar modelo:', err);
      setSuccessMessage('');
      setErrorMessage(err.response?.data?.message || 'Error al agregar modelo');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Iniciar edición
  const editModel = (model) => {
    setCatalogType(model.id_device == null ? 'VEHICLE' : 'TECHNOLOGY');
    setEditingId(model.id);
    setEditingName(model.name);
    setEditingBrand(model.brandId || model.brand_id || model.id_brand || '');
    setEditingDevice(model.deviceId || model.id_device || '');
  };

  // Guardar edición
  const saveModel = async (id) => {
    if (!editingName.trim() || !editingBrand || (catalogType === 'TECHNOLOGY' && !editingDevice)) return;
    const duplicate = similarEditingModels.find((model) => normalizeCatalogName(model.name) === normalizeCatalogName(editingName));
    if (duplicate) {
      setSuccessMessage('');
      setErrorMessage(`Ya existe un modelo equivalente: ${duplicate.name}`);
      return;
    }
    try {
      await api.put(`/api/models/${id}`, {
        name: editingName,
        id_brand: editingBrand,
        id_device: catalogType === 'VEHICLE' ? null : editingDevice,
      });
      setEditingId(null);
      setEditingName('');
      setEditingBrand('');
      setEditingDevice('');
      fetchModels();
      setErrorMessage('');
      setSuccessMessage('Modelo actualizado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      setSuccessMessage('');
      setErrorMessage(err.response?.data?.message || 'Error al guardar modelo');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const deleteModel = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este modelo?')) return;
    try {
      await api.delete(`/api/models/${id}`);
      fetchModels();
      setErrorMessage('');
      setSuccessMessage('Modelo eliminado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al eliminar modelo:', err);
      setSuccessMessage('');
      setErrorMessage(err.response?.data?.message || 'Error al eliminar modelo');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  //  Filtrado
  const filteredModels = models.filter((m) => {
    // Intentar diferentes nombres de campo para la marca
    const brandId = m.id_brand;
    const deviceId = m.id_device;

    const brandName = brands.find((b) => b.id === brandId)?.name || '';
    const deviceName = devices.find((d) => d.id === deviceId)?.name || '';

    const term = normalizeCatalogName(search);
    return (
      normalizeCatalogName(m.name).includes(term) ||
      normalizeCatalogName(brandName).includes(term) ||
      normalizeCatalogName(deviceName).includes(term)
    ) && (catalogType === 'TECHNOLOGY' ? deviceId != null : deviceId == null);
  });

  const sortedModels = [...filteredModels].sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedModels = sortedModels.slice(startIndex, endIndex);
  const normalizedNewModel = normalizeCatalogName(newModel);
  const duplicateModels = normalizedNewModel
    ? models.filter((model) =>
        Number(model.id_brand) === Number(selectedBrand) &&
        (catalogType === 'VEHICLE'
          ? model.id_device == null
          : Number(model.id_device) === Number(selectedDevice)) &&
        normalizeCatalogName(model.name) === normalizedNewModel
      )
    : [];
  const similarModels = normalizedNewModel
    ? models
        .filter((model) => normalizeCatalogName(model.name).includes(normalizedNewModel))
        .sort((a, b) => {
          const aMatchesSelection = Number(a.id_brand) === Number(selectedBrand) &&
            (catalogType === 'VEHICLE' ? a.id_device == null : Number(a.id_device) === Number(selectedDevice));
          const bMatchesSelection = Number(b.id_brand) === Number(selectedBrand) &&
            (catalogType === 'VEHICLE' ? b.id_device == null : Number(b.id_device) === Number(selectedDevice));
          return Number(bMatchesSelection) - Number(aMatchesSelection) || a.name.localeCompare(b.name);
        })
    : [];
  const similarEditingModels = editingName.trim()
    ? models.filter((model) =>
        Number(model.id) !== Number(editingId) &&
        Number(model.id_brand) === Number(editingBrand) &&
        (catalogType === 'VEHICLE'
          ? model.id_device == null
          : Number(model.id_device) === Number(editingDevice)) &&
        normalizeCatalogName(model.name).includes(normalizeCatalogName(editingName))
      )
    : [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gestión de Modelos</h2>
      </div>

      <label className="block max-w-xs text-sm font-medium">Tipo de catálogo
        <select value={catalogType} onChange={(event) => { setCatalogType(event.target.value); setSelectedBrand(''); setSelectedDevice(''); }} className="mt-1 w-full rounded border px-2 py-2">
          <option value="TECHNOLOGY">Equipos tecnológicos</option>
          <option value="VEHICLE">Vehículos</option>
        </select>
      </label>

      {successMessage && (
        <div className="p-2 mb-2 text-green-800 bg-green-200 rounded">{successMessage}</div>
      )}

      {errorMessage && (
        <div className="p-2 mb-2 text-red-700 bg-red-100 border border-red-400 rounded">
          {errorMessage}
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, marca o dispositivo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2 py-1 border rounded"
        />
      </div>

      <ModelsTable
        models={paginatedModels}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        brands={availableBrands}
        editingId={editingId}
        editingName={editingName}
        editingBrand={editingBrand}
        setEditingName={setEditingName}
        setEditingBrand={setEditingBrand}
        newModel={newModel}
        setNewModel={setNewModel}
        addModel={addModel}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        editModel={editModel}
        saveModel={saveModel}
        deleteModel={deleteModel}
        selectedDevice={selectedDevice}
        setSelectedDevice={setSelectedDevice}
        editingDevice={editingDevice}
        setEditingDevice={setEditingDevice}
        devices={devices}
        catalogType={catalogType}
        similarModels={similarModels}
        similarEditingModels={similarEditingModels}
        addActionLabel={canCreateModel ? 'Agregar' : 'Solicitar creación'}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}
