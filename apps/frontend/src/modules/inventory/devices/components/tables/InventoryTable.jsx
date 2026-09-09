// InventoryTable.jsx

import React, { useMemo, useState } from 'react';
import ActionButton from '../../../../../shared/components/ui/ActionButton';
import Pagination from '../../../../../shared/components/ui/Pagination';
import useAuth from '../../../../../shared/hooks/useAuth';

function InventoryTable({
  inventory,
  onPrint,
  onEdit,
  onView,
  search,
  visibleColumns = {},
  onSummaryChange,
  onFilteredDataChange,
  serverPagination = false,
  currentPage: controlledPage,
  totalPages: controlledTotalPages,
  serverTotal,
  serverSummary,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  serverFilters,
  onFiltersChange,
  filterOptions = {},
}) {
  const itemsPerPage = serverPagination ? pageSize : 15;
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
  const [localFilters, setLocalFilters] = useState({
    ubication_name: '',
    department_name: '',
    administrative_area_name: '',
    user: '',
    device_name: '',
    brand_name: '',
    model_name: '',
    status_name: '',
  });

  // función para actualizar un filtro
  const handleFilterChange = (column, value) => {
    if (serverPagination && onFiltersChange) {
      onFiltersChange((prev) => ({
        ...prev,
        [column]: value,
        ...(column === 'ubication_name' ? { department_name: '' } : {}),
      }));
    } else {
      setLocalFilters((prev) => ({ ...prev, [column]: value }));
    }
    setCurrentPage(1);
  };

  const filters = serverPagination ? serverFilters || {} : localFilters;

  const getOptions = (key, currentValues) =>
    [...new Set([...(filterOptions[key] || []), ...currentValues.filter(Boolean)])].sort((a, b) =>
      String(a).localeCompare(String(b), 'es', { sensitivity: 'base' })
    );

  // aplicar filtros antes de paginar
  const locallyFilteredInventory = inventory.filter((item) => {
    return Object.keys(filters).every((key) => {
      if (!filters[key]) return true;
      return String(item[key]) === String(filters[key]);
    });
  });

  const filteredInventory = serverPagination ? inventory : locallyFilteredInventory;

  //  Ordenar por Marbete (tag) ascendente
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (a.tag < b.tag) return -1;
    if (a.tag > b.tag) return 1;
    return 0;
  });

  const inventorySummary = useMemo(() => {
    // En modo servidor, "filteredInventory" solo contiene la p\u00e1gina actual,
    // por lo que los KPIs deben venir de un resumen global calculado en el backend.
    if (serverPagination && serverSummary) {
      return {
        total: Number(serverTotal) || 0,
        active: Number(serverSummary.active) || 0,
        warning: Number(serverSummary.warning) || 0,
        locations: Number(serverSummary.locations) || 0,
      };
    }

    const total = serverPagination ? Number(serverTotal) || 0 : filteredInventory.length;
    const active = filteredInventory.filter((item) => {
      const status = String(item.status_name || '').toUpperCase();
      return status && !['DESCARTADO', 'PARA DESCARTE', 'MAL ESTADO'].includes(status);
    }).length;
    const warning = filteredInventory.filter((item) => {
      const status = String(item.status_name || '').toUpperCase();
      return ['PARA DESCARTE', 'MAL ESTADO'].includes(status);
    }).length;
    const locations = new Set(filteredInventory.map((item) => item.ubication_name).filter(Boolean))
      .size;

    return { total, active, warning, locations };
  }, [filteredInventory, serverPagination, serverSummary, serverTotal]);

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
    ubication_name: getOptions(
      'ubication_name',
      filteredInventory.map((i) => i.ubication_name)
    ),
    department_name: getOptions('department_name', filteredInventory.map((i) => i.department_name)),
    administrative_area_name: getOptions(
      'administrative_area_name',
      filteredInventory.map((i) => i.administrative_area_name)
    ),
    user: getOptions(
      'user',
      filteredInventory.map((i) => i.user)
    ),
    device_name: getOptions(
      'device_name',
      filteredInventory.map((i) => i.device_name)
    ),
    brand_name: getOptions(
      'brand_name',
      filteredInventory.map((i) => i.brand_name)
    ),
    model_name: getOptions(
      'model_name',
      filteredInventory.map((i) => i.model_name)
    ),
    status_name: getOptions(
      'status_name',
      filteredInventory.map((i) => i.status_name)
    ),
  };

  const showIpColumn = isColumnVisible('ip');
  const classificationLabel = (item) => item.classification?.description || 'Sin clasificación';
  const assetTypeLabel = (item) => item.asset_type?.name || 'Sin clasificar';
  const extensionLabel = (item) => item.extension?.type || 'Sin extensión';
  const visibleColumnCount =
    [
      'tag',
      'ubication_name',
      'department_name',
      'administrative_area_name',
      'user',
      'classification_name',
      'asset_type_name',
      'extension_name',
      'device_name',
      'brand_name',
      'model_name',
      'serie',
    ].filter((key) => isColumnVisible(key)).length +
    (showIpColumn ? 1 : 0) +
    1;

  // ahora paginar sobre filteredInventory en vez de inventory
  const totalPages = serverPagination
    ? controlledTotalPages || 1
    : Math.ceil(sortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = serverPagination
    ? sortedInventory
    : sortedInventory.slice(startIndex, endIndex);

  const getStatusClasses = (statusName) => {
    const status = statusName?.toUpperCase() || '';

    if (status === 'DESCARTADO') {
      return {
        row: 'bg-red-50 transition hover:bg-red-100/70',
        text: 'text-red-600 font-bold',
      };
    }

    if (status === 'PARA DESCARTE') {
      return {
        row: 'bg-yellow-50 transition hover:bg-yellow-100/70',
        text: 'text-yellow-600 font-bold',
      };
    }

    if (status === 'MAL ESTADO') {
      return {
        row: 'bg-orange-50 transition hover:bg-orange-100/70',
        text: 'text-orange-600 font-bold',
      };
    }

    if (status === 'NUEVO') {
      return {
        row: 'bg-green-50 transition hover:bg-green-100/70',
        text: 'text-green-600 font-bold',
      };
    }

    return {
      row: 'transition hover:bg-slate-50',
      text: '',
    };
  };

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {/* Encabezados de la tabla */}
              {isColumnVisible('tag') && <th className={thClass}>Marbete</th>}
              {isColumnVisible('ubication_name') && (
                <th className={tdClass}>
                  <span>Ubicación</span>
                  <select
                    value={filters.ubication_name}
                    onChange={(e) => handleFilterChange('ubication_name', e.target.value)}
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
                    onChange={(e) => handleFilterChange('department_name', e.target.value)}
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
              {isColumnVisible('user') && <th className={thClass}>Usuario</th>}
              {isColumnVisible('device_name') && (
                <th className={tdClass}>
                  <div className="flex flex-col gap-1">
                    <span>Equipo</span>

                    <select
                      value={filters.device_name}
                      onChange={(e) => handleFilterChange('device_name', e.target.value)}
                      className={filterClass}
                    >
                      <option value="">Todos</option>

                      {options.device_name.map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
              )}
              {isColumnVisible('brand_name') && (
                <th className={tdClass}>
                  <div className="flex flex-col gap-1">
                    <span>Marca</span>

                    <select
                      value={filters.brand_name}
                      onChange={(e) => handleFilterChange('brand_name', e.target.value)}
                      className={filterClass}
                    >
                      <option value="">Todos</option>

                      {options.brand_name.map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
              )}
              {isColumnVisible('model_name') && (
                <th className={tdClass}>
                  <div className="flex flex-col gap-1">
                    <span>Modelo</span>
                    <select
                      value={filters.model_name}
                      onChange={(e) => handleFilterChange('model_name', e.target.value)}
                      className={filterClass}
                    >
                      <option value="">Todos</option>
                      {options.model_name.map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
              )}
              {isColumnVisible('serie') && <th className={thClass}>Serie</th>}
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
                const statusClasses = getStatusClasses(item.status_name);

                return (
                  <tr key={item.id} className={statusClasses.row}>
                    {isColumnVisible('tag') && (
                      <td className={`${tdClass} ${statusClasses.text}`}>{item.tag}</td>
                    )}

                    {isColumnVisible('ubication_name') && (
                      <td className={tdClass}>{item.ubication_name || '-'}</td>
                    )}

                    {isColumnVisible('department_name') && (
                      <td className={tdClass}>{item.department_name || '-'}</td>
                    )}

                    {isColumnVisible('user') && <td className={tdClass}>{item.user || '-'}</td>}

                    {isColumnVisible('device_name') && (
                      <td className={tdClass}>{item.device_name}</td>
                    )}

                    {isColumnVisible('brand_name') && (
                      <td className={tdClass}>{item.brand_name}</td>
                    )}

                    {isColumnVisible('model_name') && (
                      <td className={tdClass}>{item.model_name}</td>
                    )}

                    {isColumnVisible('serie') && <td className={tdClass}>{item.serie}</td>}

                    {showIpColumn && <td className={tdClass}>{item.ip || '-'}</td>}

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
                            type="edit"
                            title="Editar equipo"
                            onClick={() => item && onEdit(item)}
                          />
                        )}

                        <ActionButton
                          type="print"
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
          currentPage={serverPagination ? controlledPage : currentPage}
          totalPages={totalPages}
          onPageChange={(page) =>
            serverPagination && onPageChange ? onPageChange(page) : setCurrentPage(page)
          }
        />
        {serverPagination && onPageSizeChange && (
          <label className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-600">
            Registros por página
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded border border-slate-300 bg-white px-2 py-1"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

export default InventoryTable;
