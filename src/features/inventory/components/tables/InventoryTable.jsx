// InventoryTable.jsx
import React, { useState } from 'react';
import { formatDateToDDMMYYYY } from '@/shared/utils/formatDate';
import useAuth from '@/shared/hooks/useAuth';
import ActionButton from "@/shared/components/ui/ActionButton";
import Pagination from '@/shared/components/ui/Pagination';

function InventoryTable({ inventory, onPrint, onEdit, search }) {
    const itemsPerPage = 15;
    const [currentPage, setCurrentPage] = useState(1);
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const { userType } = useAuth();

    const tdClass = "px-4 py-2 text-center text-sm text-gray-700 border";
    const thClass = "px-4 py-0 text-center text-sm text-gray-700 border";

    const toggleExtraColumns = () => {
        setShowExtraColumns(prev => !prev);
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);


    // estado para filtros
    const [filters, setFilters] = useState({
        ubication_name: "",
        department_name: "",
        user: "",
        device_name: "",
        brand_name: "",
        model_name: "",
        status_name: ""
    });

    // función para actualizar un filtro
    const handleFilterChange = (column, value) => {
        setFilters(prev => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    };

    // aplicar filtros antes de paginar
    const filteredInventory = inventory.filter(item => {
        return Object.keys(filters).every(key => {
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

    // Crear opciones ordenadas alfabéticamente
    const options = {
        ubication_name: [...new Set(filteredInventory.map(i => i.ubication_name))].sort(),
        department_name: [...new Set(filteredInventory.map(i => i.department_name))].sort(),
        user: [...new Set(filteredInventory.map(i => i.user))].sort(),
        device_name: [...new Set(filteredInventory.map(i => i.device_name))].sort(),
        brand_name: [...new Set(filteredInventory.map(i => i.brand_name))].sort(),
        model_name: [...new Set(filteredInventory.map(i => i.model_name))].sort(),
        status_name: [...new Set(filteredInventory.map(i => i.status_name))].sort()
    };

    // ahora paginar sobre filteredInventory en vez de inventory
    const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = sortedInventory.slice(startIndex, endIndex);

    return (
        <div className="p-1 bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
                <button
                    onClick={() => setFilters({
                        ubication_name: "",
                        department_name: "",
                        user: "",
                        device_name: "",
                        brand_name: "",
                        model_name: "",
                        status_name: ""
                    })}
                    className="px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                >
                    Quitar filtros
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* Encabezados de la tabla */}
                            <th className={`${tdClass} border`}>Marbete</th>
                            <th className={tdClass}>
                                <span>Ubicación</span>
                                <br />
                                <select
                                    value={filters.ubication_name}
                                    onChange={(e) => handleFilterChange("ubication_name", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {options.ubication_name.map((val, idx) => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </th>

                            <th className={tdClass}>
                                <span>Departamento</span>
                                <br />
                                <select
                                    value={filters.department_name}
                                    onChange={(e) => handleFilterChange("department_name", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {options.department_name.map((val, idx) => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </th>
                            <th className={`${tdClass} border`}>Usuario</th>
                            <th className={`${tdClass} border`}>Equipo
                                <br />
                                <select
                                    value={filters.device_name}
                                    onChange={(e) => handleFilterChange("device_name", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {options.device_name.map((val, idx) => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </th>
                            <th className={`${tdClass} border`}>Marca
                                <br />
                                <select
                                    value={filters.brand_name}
                                    onChange={(e) => handleFilterChange("brand_name", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {options.brand_name.map((val, idx) => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </th>
                            <th className={`${tdClass} border`}>Modelo
                                <br />
                                <select
                                    value={filters.model_name}
                                    onChange={(e) => handleFilterChange("model_name", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {options.model_name.map((val, idx) => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </th>
                            <th className={`${tdClass} border`}>Serie</th>
                            {showExtraColumns && <th className={`${tdClass} border`}>IP</th>}
                            {showExtraColumns && <th className={`${tdClass} border`}>Estado
                                <br />
                                <select
                                    value={filters.status_name}
                                    onChange={(e) => handleFilterChange("status_name", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {options.status_name.map((val, idx) => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </th>}
                            {showExtraColumns && <th className={`${tdClass} border`}>Fecha Traslado
                                <br />
                                <select
                                    value={filters.transferdate}
                                    onChange={(e) => handleFilterChange("transferdate", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {sortedInventory
                                        .map(i => i.transferdate)
                                        .filter((value, index, self) => value && self.indexOf(value) === index)
                                        .sort()
                                        .map(val => (
                                            <option key={val} value={val}>
                                                {formatDateToDDMMYYYY(val)}
                                            </option>
                                        ))}

                                </select>
                            </th>}
                            {showExtraColumns && <th className={`${tdClass} border`}>Observación / Ubicación Anterior</th>}
                            <th className={`${tdClass} border`}>
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    {/* Cuerpo de la tabla */}
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedItems.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="px-6 py-4 text-sm text-center text-gray-500 whitespace-normal">
                                    No hay dispositivos para mostrar.
                                </td>
                            </tr>
                        ) : (
                            paginatedItems.map(item => {
                                const status = item.status_name?.toUpperCase() || "";
                                const isDiscarded = status === "DESCARTADO";
                                const isForDiscard = status === "PARA DESCARTE";
                                const isBadCondition = status === "MAL ESTADO";

                                return (
                                    <tr
                                        key={item.id}
                                        className={
                                            isDiscarded
                                                ? "bg-red-50"
                                                : isForDiscard
                                                    ? "bg-yellow-50"
                                                    : isBadCondition
                                                        ? "bg-orange-50"
                                                        : ""
                                        }
                                    >
                                        <th
                                            className={`${thClass} border ${isDiscarded
                                                    ? "text-red-600 font-bold"
                                                    : isForDiscard
                                                        ? "text-yellow-600 font-bold"
                                                        : isBadCondition
                                                            ? "text-orange-600 font-bold"
                                                            : ""
                                                }`}
                                        >
                                            {item.tag}
                                        </th>

                                        <td className={`${thClass} border`}>{item.ubication_name}</td>
                                        <td className={`${thClass} border`}>{item.department_name}</td>
                                        <td className={`${thClass} border`}>{item.user}</td>
                                        <td className={`${thClass} border`}>{item.device_name}</td>
                                        <td className={`${thClass} border`}>{item.brand_name}</td>
                                        <td className={`${thClass} border`}>{item.model_name}</td>
                                        <td className={`${thClass} border`}>{item.serie}</td>

                                        {showExtraColumns && (
                                            <td className={`${thClass} border`}>{item.ip ? item.ip : 'N/A'}</td>
                                        )}
                                        {showExtraColumns && (
                                            <td className={`${thClass} border`}>{item.status_name}</td>
                                        )}
                                        {showExtraColumns && (
                                            <td className={`${thClass} border`}>
                                                {item.transferdate ? formatDateToDDMMYYYY(item.transferdate) : 'N/A'}
                                            </td>
                                        )}
                                        {showExtraColumns && (
                                            <td className={`${thClass} border`}>{item.observation || 'N/A'}</td>
                                        )}

                                        {/* Acciones */}
                                        <td className={`${thClass} border`}>
                                            <div className="flex items-center justify-center h-full gap-2">
                                                <button
                                                    className="p-1 text-gray-600 rounded hover:text-gray-800 hover:bg-blue-200"
                                                    title={showExtraColumns ? 'Ocultar columnas' : 'Mostrar columnas'}
                                                    onClick={toggleExtraColumns}
                                                >
                                                    🔍
                                                </button>

                                                {userType === 'admin' && (
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
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />

        </div >
    )
}

export default InventoryTable;