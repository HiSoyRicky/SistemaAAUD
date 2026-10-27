import ActionButton from '../../../../shared/components/ui/ActionButton';

export default function ModelsTable({ models, currentPage, itemsPerPage, brands, devices, editModel, deleteModel, catalogType }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">#</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Marca</th>
            <th className="px-4 py-3">{catalogType === 'VEHICLE' ? 'Tipo de catálogo' : 'Dispositivo'}</th><th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {models.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No hay modelos para mostrar.</td></tr>}
          {models.map((model, index) => (
            <tr key={model.id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{model.name}</td>
              <td className="px-4 py-3">{brands.find((brand) => Number(brand.id) === Number(model.id_brand))?.name || 'S/M'}</td>
              <td className="px-4 py-3">{catalogType === 'VEHICLE' ? 'Vehículo' : devices.find((device) => Number(device.id) === Number(model.id_device))?.name || 'S/D'}</td>
              <td className="px-4 py-3"><div className="flex justify-center gap-2"><ActionButton type="edit" title="Editar modelo" onClick={() => editModel(model)} /><ActionButton type="delete" title="Eliminar modelo" onClick={() => deleteModel(model.id)} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
