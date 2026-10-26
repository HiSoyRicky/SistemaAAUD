// ModelsTable.jsx

import ActionButton from '../../../../shared/components/ui/ActionButton';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';
import { Fragment } from 'react';

export default function ModelsTable({
  models,
  currentPage,
  itemsPerPage,
  brands,
  newModel,
  setNewModel,
  addModel,
  selectedBrand,
  setSelectedBrand,
  editingId,
  editingName,
  editingBrand,
  setEditingName,
  setEditingBrand,
  editModel,
  saveModel,
  selectedDevice,
  setSelectedDevice,
  devices,
  editingDevice,
  setEditingDevice,
  deleteModel,
  catalogType = 'TECHNOLOGY',
  similarModels = [],
  similarEditingModels = [],
  addActionLabel = 'Agregar',
}) {
  return (
    <div>
      {/* Agregar */}
      <div className="flex gap-2 mb-4">
        {catalogType === 'TECHNOLOGY' && <select
          value={selectedDevice}
          onChange={(e) => {
            setSelectedDevice(e.target.value);
            setSelectedBrand('');
          }}
          className="px-2 py-1 border rounded"
        >
          <option value="">Seleccione un dispositivo</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>}

        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value === '' ? '' : Number(e.target.value))}
          className="px-2 py-1 border rounded"
          disabled={catalogType === 'TECHNOLOGY' && !selectedDevice}
        >
            <option value="">Seleccionar Marca</option>
          {[...new Map(brands.map((b) => [normalizeCatalogName(b.name), b])).values()].map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          placeholder="Nuevo Modelo"
          className="px-2 py-1 border rounded"
        />

          <button
          type="button"
          onClick={addModel}
          className="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
          disabled={(catalogType === 'TECHNOLOGY' && !selectedDevice) || !selectedBrand || !newModel.trim()}
        >
          {addActionLabel}
        </button>
      </div>
      {similarModels.length > 0 && (
        <ul className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm" aria-label="Modelos similares">
          <li className="mb-1 font-semibold">Modelos similares existentes</li>
          {similarModels.slice(0, 8).map((model) => {
            const brandName = brands.find((brand) => Number(brand.id) === Number(model.id_brand))?.name;
            const deviceName = devices.find((device) => Number(device.id) === Number(model.id_device))?.name;
            return (
              <li key={model.id} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{model.name}</span>
                <span className="text-amber-900/75">
                  {[brandName, deviceName || (model.id_device == null ? 'Vehículos' : null)].filter(Boolean).join(' · ')}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Tabla */}
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-1 text-center border">#</th>
            <th className="px-3 py-1 border">Nombre</th>
            <th className="px-3 py-1 border">Marca</th>
            <th className="px-3 py-1 border">{catalogType === 'VEHICLE' ? 'Tipo de catálogo' : 'Dispositivo'}</th>
            <th className="px-3 py-1 text-center border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m, index) => {
            // Determinar los IDs de marca y dispositivo
            const brandId = m.id_brand;
            const deviceId = m.id_device;

            return (
              <Fragment key={m.id}>
              <tr>
                <td className="px-3 py-1 text-center border">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>

                <td className="px-3 py-1 border">
                  {editingId === m.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  ) : (
                    m.name
                  )}
                </td>

                <td className="px-3 py-1 border">
                  {editingId === m.id ? (
                    <select
                      value={editingBrand ?? ''}
                      onChange={(e) =>
                        setEditingBrand(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="">Seleccionar Marca</option>
                      {[...new Map(brands.map((b) => [normalizeCatalogName(b.name), b])).values()].map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (() => {
                      if (brandId && brands.some((b) => b.id === brandId)) {
                        return brands.find((b) => b.id === brandId).name;
                      }
                      return 'S/M';
                    })()
                  )}
                </td>

                <td className="px-3 py-1 border">
                  {editingId === m.id ? (
                    catalogType === 'TECHNOLOGY' ? <select
                      value={editingDevice ?? ''}
                      onChange={(e) =>
                        setEditingDevice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="">Seleccionar Dispositivo</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select> : <span>Vehículo</span>
                  ) : (
                    catalogType === 'VEHICLE' ? 'Vehículo' : (() => {
                      if (deviceId && devices.some((d) => d.id === deviceId)) {
                        return devices.find((d) => d.id === deviceId).name;
                      }
                      return 'S/D';
                    })()
                  )}
                </td>

                <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                  {editingId === m.id ? (
                    <>
                      <ActionButton
                        type={'save'}
                        title="Guardar modelo"
                        onClick={() => saveModel(m.id)}
                      />
                      <ActionButton
                        type={'delete'}
                        title="Eliminar modelo"
                        onClick={() => deleteModel(m.id)}
                      />
                    </>
                  ) : (
                    <ActionButton
                      type={'edit'}
                      title="Editar modelo"
                      onClick={() => editModel(m)}
                    />
                  )}
                </td>
              </tr>
              {editingId === m.id && similarEditingModels.length > 0 && (
                <tr>
                  <td colSpan="5" className="border px-3 py-2 text-sm text-amber-900">
                    <span className="font-semibold">Modelos similares existentes: </span>
                    {similarEditingModels.slice(0, 8).map((model) => model.name).join(' · ')}
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
