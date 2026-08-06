// InventoryTable.jsx
import React, { useMemo, useState } from 'react';
import useAuth from '../../../../../shared/hooks/useAuth';
import ActionButton from '../../../../../shared/components/ui/ActionButton';
import Pagination from '../../../../../shared/components/ui/Pagination';

function InventoryTable({
  inventory,
  onPrint,
  onEdit,
  onView,
  search,
  visibleColumns = {},
  onSummaryChange,
  onFilteredDataChange,
}) {
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const { hasAnyPermission } = useAuth();
  const canEditInventory = hasAnyPermission([
    'inventory.update',
    'inventory.update_location',
    'inventory.update_department',
    'inventory.update_assignee',
  ]);

  const tdClass =
    'border-x border-slate-100 px-4 py-3 text-center align-middle text-sm text-slate-700';
  const thClass =
    'border-x border-slate-100 px-4 py-3 text-center align-middle text-xs font-bold uppercase tracking-wide text-slate-500';
  const filterClass =
    'mt-2 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-center text-xs font-medium normal-case tracking-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const isColumnVisible = (key) => visibleColumns[key] !== false;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // estado para filtros
  const [filters, setFilters] = useState({
    ubication_name: '',
    department_name: '',
    user: '',
    device_name: '',
    brand_name: '',
    model_name: '',
    status_name: '',
  });

  // función para actualizar un filtro
  const handleFilterChange = (column, value) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setCurrentPage(1);
  };

  // aplicar filtros antes de paginar
  const filteredInventory = inventory.filter((item) => {
    return Object.keys(filters).every((key) => {
      if (!filters[key]) return true;
      return String(item[key]) === String(filters[key]);
    });
  });

  //  Ordenar por Marbete (tag) ascendente
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (a.tag < b.tag) return -1;
    if (a.tag > b.tag) return 1;
    return 0;
  });

  const inventorySummary = useMemo(() => {
    const total = filteredInventory.length;
    const active = filteredInventory.filter((item) => {
      const status = String(item.status_name || '').toUpperCase();
      return (
        status &&
        !['DESCARTADO', 'PARA DESCARTE', 'MAL ESTADO'].includes(status)
      );
    }).length;
    const warning = filteredInventory.filter((item) => {
      const status = String(item.status_name || '').toUpperCase();
      return ['PARA DESCARTE', 'MAL ESTADO'].includes(status);
    }).length;
    const locations = new Set(
      filteredInventory.map((item) => item.ubication_name).filter(Boolean)
    ).size;

    return { total, active, warning, locations };
  }, [filteredInventory]);

  React.useEffect(() => {
    if (typeof onSummaryChange === 'function') {
      onSummaryChange(inventorySummary);
    }
  }, [inventorySummary, onSummaryChange]);

  React.useEffect(() => {
    if (typeof onFilteredDataChange === 'function') {
      onFilteredDataChange(sortedInventory);
    }
  }, [sortedInventory, onFilteredDataChange]);

  // Crear opciones ordenadas alfabéticamente
  const options = {
    ubication_name: [
      ...new Set(
        filteredInventory.map((i) => i.ubication_name).filter(Boolean)
      ),
    ].sort(),
    department_name: [
      ...new Set(
        filteredInventory.map((i) => i.department_name).filter(Boolean)
      ),
    ].sort(),
    user: [
      ...new Set(filteredInventory.map((i) => i.user).filter(Boolean)),
    ].sort(),
    device_name: [
      ...new Set(filteredInventory.map((i) => i.device_name).filter(Boolean)),
    ].sort(),
    brand_name: [
      ...new Set(filteredInventory.map((i) => i.brand_name).filter(Boolean)),
    ].sort(),
    model_name: [
      ...new Set(filteredInventory.map((i) => i.model_name).filter(Boolean)),
    ].sort(),
    status_name: [
      ...new Set(filteredInventory.map((i) => i.status_name).filter(Boolean)),
    ].sort(),
  };
  const showIpColumn = isColumnVisible('ip');
  const visibleColumnCount =
    [
      'tag',
      'ubication_name',
      'department_name',
      'user',
      'device_name',
      'brand_name',
      'model_name',
      'serie',
    ].filter((key) => isColumnVisible(key)).length +
    (showIpColumn ? 1 : 0) +
    1;

  // ahora paginar sobre filteredInventory en vez de inventory
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedInventory.slice(startIndex, endIndex);

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {/* Encabezados de la tabla */}
              {isColumnVisible('tag') && (
                <th className={thClass}>Marbete</th>
              )}
              {isColumnVisible('ubication_name') && (
                <th className={tdClass}>
                  <span>Ubicación</span>
                  <select
                    value={filters.ubication_name}
                    onChange={(e) =>
                      handleFilterChange('ubication_name', e.target.value)
                    }
                    className={filterClass}
                  >
                    <option value="">Todos</option>
                    {options.ubication_name.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </th>
              )}

              {isColumnVisible('department_name') && (
                <th className={tdClass}>
                  <span>Departamento</span>
                  <select
                    value={filters.department_name}
                    onChange={(e) =>
                      handleFilterChange('department_name', e.target.value)
                    }
                    className={filterClass}
                  >
                    <option value="">Todos</option>
                    {options.department_name.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </th>
              )}
              {isColumnVisible('user') && (
                <th className={thClass}>Usuario</th>
              )}
              {isColumnVisible('device_name') && (
                <th className={tdClass}>
                  Equipo
                  <select
                    value={filters.device_name}
                    onChange={(e) =>
                      handleFilterChange('device_name', e.target.value)
                    }
                    className={filterClass}
                  >
                    <option value="">Todos</option>
                    {options.device_name.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </th>
              )}
              {isColumnVisible('brand_name') && (
                <th className={tdClass}>
                  Marca
                  <select
                    value={filters.brand_name}
                    onChange={(e) =>
                      handleFilterChange('brand_name', e.target.value)
                    }
                    className={filterClass}
                  >
                    <option value="">Todos</option>
                    {options.brand_name.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </th>
              )}
              {isColumnVisible('model_name') && (
                <th className={tdClass}>
                  Modelo
                  <select
                    value={filters.model_name}
                    onChange={(e) =>
                      handleFilterChange('model_name', e.target.value)
                    }
                    className={filterClass}
                  >
                    <option value="">Todos</option>
                    {options.model_name.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </th>
              )}
              {isColumnVisible('serie') && (
                <th className={thClass}>Serie</th>
              )}
              {showIpColumn && <th className={thClass}>IP</th>}

              <th className={thClass}>Acciones</th>
            </tr>
          </thead>

          {/* Cuerpo de la tabla */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumnCount}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No hay dispositivos para mostrar.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const status = item.status_name?.toUpperCase() || '';
                const isDiscarded = status === 'DESCARTADO';
                const isForDiscard = status === 'PARA DESCARTE';
                const isBadCondition = status === 'MAL ESTADO';
                const isNew = status === 'NUEVO';

                return (
                  <tr
                    key={item.id}
                    className={
                      isDiscarded
                        ? 'bg-red-50 transition hover:bg-red-100/70'
                        : isForDiscard
                          ? 'bg-yellow-50 transition hover:bg-yellow-100/70'
                          : isBadCondition
                            ? 'bg-orange-50 transition hover:bg-orange-100/70'
                            : isNew
                              ? 'bg-green-50 transition hover:bg-green-100/70'
                              : 'transition hover:bg-slate-50'
                    }
                  >
                    {isColumnVisible('tag') && (
                      <th
                        className={`${tdClass} font-bold ${
                          isDiscarded
                            ? 'text-red-600 font-bold'
                            : isForDiscard
                              ? 'text-yellow-600 font-bold'
                              : isBadCondition
                                ? 'text-orange-600 font-bold'
                                : isNew
                                  ? 'text-green-600 font-bold'
                                  : ''
                        }`}
                      >
                        {item.tag}
                      </th>
                    )}

                    {isColumnVisible('ubication_name') && (
                      <td className={tdClass}>{item.ubication_name || '-'}</td>
                    )}
                    {isColumnVisible('department_name') && (
                      <td className={tdClass}>
                        {item.department_name || '-'}
                      </td>
                    )}
                    {isColumnVisible('user') && (
                      <td className={tdClass}>{item.user || '-'}</td>
                    )}
                    {isColumnVisible('device_name') && (
                      <td className={tdClass}>{item.device_name}</td>
                    )}
                    {isColumnVisible('brand_name') && (
                      <td className={tdClass}>{item.brand_name}</td>
                    )}
                    {isColumnVisible('model_name') && (
                      <td className={tdClass}>{item.model_name}</td>
                    )}
                    {isColumnVisible('serie') && (
                      <td className={tdClass}>{item.serie}</td>
                    )}
                    {showIpColumn && (
                      <td className={tdClass}>{item.ip || '-'}</td>
                    )}

                    {/* Acciones */}
                    <td className={tdClass}>
                      <div className="flex items-center justify-center h-full gap-2">
                        <ActionButton
                          type="view"
                          title="Ver detalles del equipo"
                          onClick={() => item && onView(item)}
                        />

                        {canEditInventory && (
                          <ActionButton
                            type={'edit'}
                            title="Editar equipo"
                            onClick={() => item && onEdit(item)}
                          />
                        )}

                        <ActionButton
                          type={'print'}
                          title="Imprimir equipo"
                          onClick={() => item && onPrint(item)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}

export default InventoryTable;
