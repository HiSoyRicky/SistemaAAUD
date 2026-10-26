// TonersTable.jsx

import { useMemo, useState } from 'react';
import ActionButton from '../../../../shared/components/ui/ActionButton';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';

export default function TonersTable({
  toners,
  currentPage,
  itemsPerPage,
  startEdit,
  deleteToner,
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const normalizedSearch = normalizeCatalogName(search);

    return toners.filter(
      (toner) =>
        normalizeCatalogName(toner.toner_model).includes(normalizedSearch) ||
        normalizeCatalogName(toner.color).includes(normalizedSearch)
    );
  }, [toners, search]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 space-y-3 bg-white rounded shadow">
      {/* 🔎 Barra búsqueda */}
      <input
        type="text"
        placeholder="Buscar por modelo o color..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-2 py-1 border rounded"
      />

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-1 text-center border">#</th>
            <th className="px-3 py-1 border">Modelo</th>
            <th className="px-3 py-1 border">Color</th>
            <th className="px-3 py-1 text-center border">Stock</th>
            <th className="px-3 py-1 text-center border">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((t, i) => (
            <tr key={t.id}>
              <td className="px-3 py-1 text-center border">
                {(currentPage - 1) * itemsPerPage + i + 1}
              </td>

              <td className="px-3 py-1 border">{t.toner_model}</td>
              <td className="px-3 py-1 border">{t.color}</td>
              <td className="px-3 py-1 text-center border">{t.stock}</td>

              <td className="px-3 py-1 border flex justify-center gap-2">
                <ActionButton type="edit" title="Editar tóner" onClick={() => startEdit(t)} />

                <ActionButton
                  type="trash"
                  title="Eliminar tóner"
                  onClick={() => deleteToner(t.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
