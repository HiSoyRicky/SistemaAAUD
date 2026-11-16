import ActionButton from '@/shared/components/ui/ActionButton';

export default function UbicationsTable({ ubications, currentPage, itemsPerPage, canUpdate, editUbication }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200" role="region" aria-label="Ubicaciones" tabIndex={0}>
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="px-3 py-3 text-center">#</th><th className="px-4 py-3 text-left">Nombre</th><th className="px-3 py-3 text-center">Acciones</th></tr>
        </thead>
        <tbody>
          {ubications.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No hay ubicaciones para mostrar.</td></tr>}
          {ubications.map((item, index) => <tr key={item.id} className="border-t border-slate-100">
            <td className="px-3 py-3 text-center text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
            <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
            <td className="px-3 py-3 text-center">{canUpdate && <ActionButton type="edit" title="Editar ubicación" onClick={() => editUbication(item)} />}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
