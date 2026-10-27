import ActionButton from '../../../../shared/components/ui/ActionButton';

export default function BrandsTable({ brands, editBrand, deleteBrand, currentPage = 1, itemsPerPage = 10 }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="px-4 py-3 text-center">#</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3 text-center">Acciones</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {brands.length === 0 ? <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">No se encontraron marcas.</td></tr> : brands.map((brand, index) => (
            <tr key={brand.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-center text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{brand.name}</td>
              <td className="px-4 py-3"><div className="flex justify-center gap-2"><ActionButton type="edit" title="Editar marca" onClick={() => editBrand(brand.id, brand.name)} /><ActionButton type="delete" title="Eliminar marca" onClick={() => deleteBrand(brand)} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
