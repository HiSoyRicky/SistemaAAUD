// ModelsManager.jsx

import { useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Modal from '../../../../shared/components/ui/Modal';
import Pagination from '../../../../shared/components/ui/Pagination';
import useAuth from '../../../../shared/hooks/useAuth';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';
import ModelsTable from './ModelsTable';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!newModel.trim() || !selectedBrand || (catalogType === 'TECHNOLOGY' && !selectedDevice))
      return;
    const duplicate = duplicateModels.find(
      (model) => normalizeCatalogName(model.name) === normalizeCatalogName(newModel)
    );
    if (duplicate) {
      setSuccessMessage('');
      setErrorMessage(`Ya existe un modelo equivalente: ${duplicate.name}`);
      return;
    }
    try {
      setSaving(true);
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
      setModalOpen(false);
      if (canCreateModel) fetchModels();
      setErrorMessage('');
      setSuccessMessage(
        canCreateModel
          ? 'Modelo agregado correctamente'
          : 'Solicitud enviada al administrador para revisión'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error al agregar modelo:', err);
      setSuccessMessage('');
      setErrorMessage(err.response?.data?.message || 'Error al agregar modelo');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Iniciar edición
  const editModel = (model) => {
    setErrorMessage('');
    setCatalogType(model.id_device == null ? 'VEHICLE' : 'TECHNOLOGY');
    setEditingId(model.id);
    setEditingName(model.name);
    setEditingBrand(model.brandId || model.brand_id || model.id_brand || '');
    setEditingDevice(model.deviceId || model.id_device || '');
    setModalOpen(true);
  };

  // Guardar edición
  const saveModel = async (id) => {
    if (!editingName.trim() || !editingBrand || (catalogType === 'TECHNOLOGY' && !editingDevice))
      return;
    const duplicate = similarEditingModels.find(
      (model) => normalizeCatalogName(model.name) === normalizeCatalogName(editingName)
    );
    if (duplicate) {
      setSuccessMessage('');
      setErrorMessage(`Ya existe un modelo equivalente: ${duplicate.name}`);
      return;
    }
    try {
      setSaving(true);
      await api.put(`/api/models/${id}`, {
        name: editingName,
        id_brand: editingBrand,
        id_device: catalogType === 'VEHICLE' ? null : editingDevice,
      });
      setEditingId(null);
      setEditingName('');
      setEditingBrand('');
      setEditingDevice('');
      setModalOpen(false);
      fetchModels();
      setErrorMessage('');
      setSuccessMessage('Modelo actualizado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      setSuccessMessage('');
      setErrorMessage(err.response?.data?.message || 'Error al guardar modelo');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving(false);
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
  }, [search, catalogType]);

  //  Filtrado
  const filteredModels = models.filter((m) => {
    // Intentar diferentes nombres de campo para la marca
    const brandId = m.id_brand;
    const deviceId = m.id_device;

    const brandName = brands.find((b) => b.id === brandId)?.name || '';
    const deviceName = devices.find((d) => d.id === deviceId)?.name || '';

    const term = normalizeCatalogName(search);
    return (
      (normalizeCatalogName(m.name).includes(term) ||
        normalizeCatalogName(brandName).includes(term) ||
        normalizeCatalogName(deviceName).includes(term)) &&
      (catalogType === 'TECHNOLOGY' ? deviceId != null : deviceId == null)
    );
  });

  const sortedModels = [...filteredModels].sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedModels = sortedModels.slice(startIndex, endIndex);
  const normalizedNewModel = normalizeCatalogName(newModel);
  const duplicateModels = normalizedNewModel
    ? models.filter(
        (model) =>
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
          const aMatchesSelection =
            Number(a.id_brand) === Number(selectedBrand) &&
            (catalogType === 'VEHICLE'
              ? a.id_device == null
              : Number(a.id_device) === Number(selectedDevice));
          const bMatchesSelection =
            Number(b.id_brand) === Number(selectedBrand) &&
            (catalogType === 'VEHICLE'
              ? b.id_device == null
              : Number(b.id_device) === Number(selectedDevice));
          return (
            Number(bMatchesSelection) - Number(aMatchesSelection) || a.name.localeCompare(b.name)
          );
        })
    : [];
  const similarEditingModels = editingName.trim()
    ? models.filter(
        (model) =>
          Number(model.id) !== Number(editingId) &&
          Number(model.id_brand) === Number(editingBrand) &&
          (catalogType === 'VEHICLE'
            ? model.id_device == null
            : Number(model.id_device) === Number(editingDevice)) &&
          normalizeCatalogName(model.name).includes(normalizeCatalogName(editingName))
      )
    : [];

  const duplicateNewModel = duplicateModels[0] || null;

  const duplicateEditingModel = similarEditingModels.find(
    (model) => normalizeCatalogName(model.name) === normalizeCatalogName(editingName)
  );

  const duplicateModel = editingId ? duplicateEditingModel : duplicateNewModel;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Gestión de Modelos</h2>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setNewModel('');
            setSelectedBrand('');
            setSelectedDevice('');
            setErrorMessage('');
            setModalOpen(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {canCreateModel ? '+ Agregar modelo' : '+ Solicitar modelo'}
        </button>
      </div>

      <label className="block max-w-xs text-sm font-medium">
        Tipo de catálogo
        <select
          value={catalogType}
          onChange={(event) => {
            setCatalogType(event.target.value);
            setSelectedBrand('');
            setSelectedDevice('');
          }}
          className="mt-1 w-full rounded border px-2 py-2"
        >
          <option value="TECHNOLOGY">Equipos tecnológicos</option>
          <option value="VEHICLE">Vehículos</option>
        </select>
      </label>

      {successMessage && (
        <div className="p-2 mb-2 text-green-800 bg-green-200 rounded">{successMessage}</div>
      )}

      {errorMessage && !modalOpen && (
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
        editModel={editModel}
        deleteModel={deleteModel}
        devices={devices}
        catalogType={catalogType}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingId(null);
            setErrorMessage('');
          }
        }}
        title={
          editingId
            ? 'Editar modelo'
            : canCreateModel
              ? 'Agregar modelo'
              : 'Solicitar creación de modelo'
        }
        size="lg"
        constrainToViewport
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!saving) {
              if (editingId) saveModel(editingId);
              else addModel();
            }
          }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-500">
            {catalogType === 'VEHICLE'
              ? 'Completa los datos del modelo de vehículo.'
              : 'Selecciona el dispositivo y la marca antes de escribir el modelo.'}
          </p>
          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          )}
          {catalogType === 'TECHNOLOGY' && (
            <label className="block text-sm font-semibold text-slate-700">
              Dispositivo
              <select
                required
                value={editingId ? editingDevice : selectedDevice}
                onChange={(event) => {
                  if (editingId) setEditingDevice(event.target.value);
                  else {
                    setSelectedDevice(event.target.value);
                    setSelectedBrand('');
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal"
              >
                <option value="">Seleccione un dispositivo</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Marca
            <select
              required
              value={editingId ? editingBrand : selectedBrand}
              disabled={!editingId && catalogType === 'TECHNOLOGY' && !selectedDevice}
              onChange={(event) =>
                editingId
                  ? setEditingBrand(event.target.value)
                  : setSelectedBrand(event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal disabled:bg-slate-100"
            >
              <option value="">Seleccione una marca</option>
              {[
                ...new Map(
                  availableBrands.map((brand) => [normalizeCatalogName(brand.name), brand])
                ).values(),
              ].map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Nombre del modelo
            <input
              autoFocus
              required
              value={editingId ? editingName : newModel}
              onChange={(event) =>
                editingId ? setEditingName(event.target.value) : setNewModel(event.target.value)
              }
              placeholder="Ej. TASKalfa 3253ci"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
            />
            {duplicateModel && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
              >
                El modelo "{duplicateModel.name}" ya existe para esta combinación de dispositivo y
                marca. No puedes registrarlo nuevamente.
              </p>
            )}
          </label>
          {(editingId ? similarEditingModels : similarModels).length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Modelos similares existentes</p>
              <ul className="mt-1 space-y-1">
                {(editingId ? similarEditingModels : similarModels).slice(0, 8).map((model) => (
                  <li key={model.id}>
                    {model.name}{' '}
                    <span className="text-amber-800/75">
                      {[
                        brands.find((brand) => Number(brand.id) === Number(model.id_brand))?.name,
                        devices.find((device) => Number(device.id) === Number(model.id_device))
                          ?.name || (model.id_device == null ? 'Vehículos' : ''),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
                setErrorMessage('');
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                Boolean(duplicateModel) ||
                !(editingId ? editingName : newModel).trim() ||
                !(editingId ? editingBrand : selectedBrand) ||
                (catalogType === 'TECHNOLOGY' && !(editingId ? editingDevice : selectedDevice))
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? 'Guardando...'
                : editingId
                  ? 'Guardar cambios'
                  : canCreateModel
                    ? 'Agregar modelo'
                    : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
