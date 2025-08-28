// src/components/inventory/InventoryTable.jsx
import React, { useState } from 'react';
import { formatDateToDDMMYYYY } from '../../utils/formatDate';
import { Printer, Edit } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

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
    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredInventory.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-lg shadow-md p-1">
            <div className="flex gap-2 mb-2 items-center">
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
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                    Quitar filtros
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className={`${tdClass} border`}>Marbete</th>
                            <th className={tdClass}>
                                <span>Ubicación</span>
                                <br />
                                <select
                                    value={filters.ubication_name}
                                    onChange={(e) => handleFilterChange("ubication_name", e.target.value)}
                                    className="border rounded text-xs text-center mt-1 w-full"
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
                                    className="border rounded text-xs text-center mt-1 w-full"
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
                                    className="border rounded text-xs text-center mt-1 w-full"
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
                                    className="border rounded text-xs text-center mt-1 w-full"
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
                                    className="border rounded text-xs text-center mt-1 w-full"
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
                                    className="border rounded text-xs text-center mt-1 w-full"
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
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedItems.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="px-6 py-4 text-center text-sm text-gray-500">
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
                                    {showExtraColumns && <td className={`${thClass} border`}>{item.transferDate ? formatDateToDDMMYYYY(item.transferDate) : 'N/A'}</td>}
                                    {showExtraColumns && <td className={`${thClass} border`}>{item.observation || 'N/A'}</td>}

                                    {/* Acciones */}
                                    <td className={`${thClass} border`}>
                                        <div className="flex justify-center items-center h-full gap-2">
                                            <button
                                                title={`Ver detalles de ${item.tag}`}
                                                onClick={() => alert(`Ver detalles de ${item.tag}`)}
                                                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Ver
                                            </button>

                                            {userType === 'admin' && (
                                                <button
                                                    title="Editar equipo"
                                                    onClick={() => item && onEdit(item)}
                                                    className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => onPrint(item)}
                                                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                <Printer size={16} />
                                            </button>
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
                    <div className="mt-4 flex justify-center">
                        {/* Botón Anterior */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
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
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )
            }

            <div className="mt-2 flex justify-center">
                <button
                    onClick={toggleExtraColumns}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    {showExtraColumns ? 'Ocultar columnas extra' : 'Mostrar columnas extra'}
                </button>
            </div>
        </div >
    )
}

export default InventoryTable;
