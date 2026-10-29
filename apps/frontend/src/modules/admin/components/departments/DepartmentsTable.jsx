import ActionButton from '../../../../shared/components/ui/ActionButton';

export default function DepartmentsTable({ departments, currentPage, itemsPerPage, canUpdate, canDelete, editDepartment, handleDelete }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200" role="region" aria-label="Departamentos" tabIndex={0}>
      <table className="w-full min-w-[42rem] text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="px-3 py-3 text-center">#</th><th className="px-4 py-3 text-left">Nombre del departamento</th><th className="px-4 py-3 text-left">Ubicación</th><th className="px-3 py-3 text-center">Acciones</th></tr>
        </thead>
        <tbody>
          {departments.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No hay departamentos para mostrar.</td></tr>}
          {departments.map((item, index) => <tr key={item.id} className="border-t border-slate-100">
            <td className="px-3 py-3 text-center text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
            <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
            <td className="px-4 py-3">{item.ubication_name || '—'}</td>
            <td className="px-3 py-3 text-center"><div className="flex justify-center gap-2">{canUpdate && <ActionButton type="edit" title="Editar departamento" onClick={() => editDepartment(item)} />}{canDelete && <ActionButton type="delete" title="Eliminar departamento" onClick={() => handleDelete(item)} />}</div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
