// src/components/inventory/InventoryTable.jsx
import React, { useState } from 'react';
import { formatDateToDDMMYYYY } from '@/utils/formatDate';
import useAuth from '@/hooks/useAuth';
import ActionButton from "@/components/ui/ActionButton";

function InventoryTable({ inventory, onPrint, onEdit }) {
    const itemsPerPage = 15;
    const [currentPage, setCurrentPage] = useState(1);
    const [showExtraColumns, setShowExtraColumns] = useState(false);
    const { userType } = useAuth();

    const tdClass = "px-4 py-2 text-center text-sm text-gray-700 border";
    const thClass = "px-4 py-0 text-center text-sm text-gray-700 border";

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const toggleExtraColumns = () => {
        setShowExtraColumns(prev => !prev);
    };

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
        setCurrentPage(1); // volver a primera página
    };

    // aplicar filtros antes de paginar
    const filteredInventory = inventory.filter(item => {
        return Object.keys(filters).every(key => {
            if (!filters[key]) return true; // si no hay filtro, no filtra
            return String(item[key]) === String(filters[key]);
        });
    });

    // 🔹 Ordenar por Marbete (tag) ascendente
    const sortedInventory = [...filteredInventory].sort((a, b) => {
        if (a.tag < b.tag) return -1;
        if (a.tag > b.tag) return 1;
        return 0;
    });

    const options = {
        ubication_name: [...new Set(filteredInventory.map(i => i.ubication_name))],
        department_name: [...new Set(filteredInventory.map(i => i.department_name))],
        user: [...new Set(filteredInventory.map(i => i.user))],
        device_name: [...new Set(filteredInventory.map(i => i.device_name))],
        brand_name: [...new Set(filteredInventory.map(i => i.brand_name))],
        model_name: [...new Set(filteredInventory.map(i => i.model_name))],
        status_name: [...new Set(filteredInventory.map(i => i.status_name))]
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
                                    {options.ubication_name.map(val => (
                                        <option key={val} value={val}>{val}</option>
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
                                    {options.department_name.map(val => (
                                        <option key={val} value={val}>{val}</option>
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
                                    {options.device_name.map(val => (
                                        <option key={val} value={val}>{val}</option>
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
                                    {options.brand_name.map(val => (
                                        <option key={val} value={val}>{val}</option>
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
                                    {options.model_name.map(val => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                            </th>
                            <th className={`${tdClass} border`}>Serie</th>
                            {showExtraColumns && <th className={`${tdClass} border`}>IP</th>}
                            <th className={`${tdClass} border`}>Estado
                                <br />
                                <select
                                    value={filters.status_name}
                                    onChange={(e) => handleFilterChange("status_name", e.target.value)}
                                    className="w-full mt-1 text-xs text-center border rounded"
                                >
                                    <option value="">Todos</option>
                                    {options.status_name.map(val => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                            </th>
                            {showExtraColumns && <th className={`${tdClass} border`}>Fecha Traslado</th>}
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
                            paginatedItems.map(item => (
                                <tr key={item.id}>
                                    <th className={`${thClass} border`}>{item.tag}</th>
                                    <td className={`${thClass} border`}>{item.ubication_name}</td>
                                    <td className={`${thClass} border`}>{item.department_name}</td>
                                    <td className={`${thClass} border`}>{item.user}</td>
                                    <td className={`${thClass} border`}>{item.device_name}</td>
                                    <td className={`${thClass} border`}>{item.brand_name}</td>
                                    <td className={`${thClass} border`}>{item.model_name}</td>
                                    <td className={`${thClass} border`}>{item.serie}</td>
                                    {showExtraColumns && (<td className={`${thClass} border`}>{item.ip ? item.ip : 'N/A'}</td>)}
                                    <td className={`${thClass} border`}>{item.status_name}</td>
                                    {showExtraColumns && <td className={`${thClass} border`}>{item.transferdate ? formatDateToDDMMYYYY(item.transferdate) : 'N/A'}</td>}
                                    {showExtraColumns && <td className={`${thClass} border`}>{item.observation || 'N/A'}</td>}

                                    {/* Acciones */}
                                    <td className={`${thClass} border`}>
                                        <div className="flex items-center justify-center h-full gap-2 ">

                                            {/* Botón Ver detalles */}
                                            <button
                                                className="p-1 text-gray-600 rounded hover:text-gray-800 hover:bg-blue-200"
                                                title={showExtraColumns ? "Ocultar columnas" : "Mostrar columnas"}
                                            >
                                                🔍
                                            </button>

                                            {/* Botón Editar - solo para admin */}
                                            {userType === 'admin' && (
                                                <ActionButton
                                                    type={"edit"}
                                                    title="Editar equipo"
                                                    onClick={() => item && onEdit(item)}
                                                >
                                                </ActionButton>
                                            )}

                                            {/* Botón Imprimir */}
                                            <ActionButton
                                                type={"print"}
                                                title="Imprimir equipo"
                                                onClick={() => item && onPrint(item)}
                                            >
                                            </ActionButton>

                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {/* Controles de paginación con saltos inteligentes */}
            {
                totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        {/* Botón Anterior */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-gray-700 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Anterior
                        </button>

                        {/* Lógica de páginas */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                                // Mostrar siempre primera, última y las cercanas a la actual
                                return (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 2 && page <= currentPage + 2)
                                );
                            })
                            .reduce((acc, page, idx, arr) => {
                                // Insertar "..." cuando haya saltos
                                if (idx > 0 && page - arr[idx - 1] > 1) {
                                    acc.push("...");
                                }
                                acc.push(page);
                                return acc;
                            }, [])
                            .map((item, index) =>
                                item === "..." ? (
                                    <span key={`dots-${index}`} className="px-2">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => handlePageChange(item)}
                                        className={`px-3 py-1 rounded ${currentPage === item
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-300"
                                            }`}
                                    >
                                        {item}
                                    </button>
                                )
                            )}

                        {/* Botón Siguiente */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-gray-700 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )
            }

            <div className="flex justify-center mt-2">
                <button
                    onClick={toggleExtraColumns}
                    className="px-3 py-1 text-gray-700 bg-gray-300 rounded hover:bg-gray-400"
                >
                    {showExtraColumns ? 'Ocultar columnas extra' : 'Mostrar columnas extra'}
                </button>
            </div>
        </div >
    )
}

export default InventoryTable;
