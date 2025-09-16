// src/pages/inventory/InventoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Tag } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '@/hooks/useAuth';
import { Inventory } from '@/services/api';
import InventoryTable from '@/components/inventory/tables/InventoryTable';
import TransferPrint from '@/components/TransferPrint';
import { useReactToPrint } from "react-to-print";
import { useNotifications } from '@/context/NotificationContext';
import { exportInventoryToExcel } from '@/utils/exportExcel';
import UbiDepSelector from '@/components/UbiDepSelector';
import InventoryFormModal from '@/components/inventory/forms/InventoryForm';

function InventoryPage() {
    const { authData, userType, loggedUserName } = useAuth();
    const [search, setSearch] = useState('');
    const [departments, setDepartments] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showInventoryForm, setShowInventoryForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const printRef = useRef();
    const { addNotification } = useNotifications();

    const loadDevices = async () => {
        try {
            const data = await Inventory.fetchDevices(search);
            setDevices(data);
        } catch (error) {
            console.error('Error al obtener dispositivos:', error);
        } finally {
        }
    };

    useEffect(() => {
        loadDevices();
    }, [search]);

    useEffect(() => {
        const loadDevices = async () => {
            try {
                // Trae TODOS los dispositivos, no uses search aquí
                const data = await Inventory.fetchDevices("");
                setDevices(data);
            } catch (error) {
                console.error('Error al obtener dispositivos:', error);
            }
        };
        loadDevices();
    }, []);


    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Traslado de dispositivo",
        onAfterPrint: () => setSelectedDevice(null),
    });

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await fetch("/api/departments"); // o usa tu servicio de api si ya existe
                const data = await res.json();
                setDepartments(data);
            } catch (error) {
                console.error("Error cargando departamentos:", error);
            }
        };

        fetchDepartments();
    }, []);


    const handlePreparePrint = (device) => {
        if (!device) {
            addNotification('Error: No se seleccionó ningún dispositivo ❌', 'error');
            return;
        }
        setSelectedDevice({
            ...device,
            role: 'recibe', // Rol inicial por defecto
            userName: loggedUserName || 'Técnico no identificado', // Nombre del técnico logueado
            userTransfiere: device.userTransfiere || '', // Nombre del emisor (puede venir del dispositivo)
            userRecibe: device.userRecibe || '', // Receptor por defecto es el técnico
            ubication_destino_id: device.ubication_destino_id || null,
            department_destino_id: device.department_destino_id || null,
            ubication_destino_name: device.ubication_destino_name || '',
            department_destino_name: device.department_destino_name || ''
        });
    };


    const editDevice = (device) => {
        console.log('Equipo seleccionado para editar:', device);
        setEditingDevice(device);
    };

    const editDeviceConfirm = async (updatedData) => {
        try {
            await Inventory.updateDevice(editingDevice.id, updatedData);
            setDevices(devices.map(device => device.id === editingDevice.id ? { ...device, ...updatedData } : device));
            setEditingDevice(null);
            addNotification('Dispositivo actualizado con éxito ✅', 'success');
        } catch (error) {
            console.error('Error al actualizar dispositivo:', error);
            addNotification('Error al actualizar dispositivo ❌', 'error');
        }
    };

    const handleAddDevice = async (formData) => {
        if (window.confirm('¿Estás seguro de que deseas agregar este dispositivo?')) {
            setShowInventoryForm(false);
            try {
                const result = await Inventory.addDevice(formData);
                setDevices([...devices, { id: result.id, ...formData }]);
                toast.success('Dispositivo agregado con éxito');
            } catch (error) {
                console.error('Error al agregar dispositivo:', error);
                toast.error('Error al agregar dispositivo');
            }
        }
    };

    const handleExportDevices = () => {
        exportInventoryToExcel(devices);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const [filters, setFilters] = useState({
        ubication: '',
        department: '',
        status: '',
        transferdate: ''
    });

    const filteredDevices = devices.filter(d => {
        const searchWords = search.toLowerCase().split(" ").filter(w => w.trim() !== "");

        // Buscar que cada palabra esté en **algún campo**
        const matchesSearch = searchWords.every(word =>
            (d.ubication_name?.toLowerCase() || "").includes(word) ||
            (d.tag?.toLowerCase() || "").includes(word) ||
            (d.department_name?.toLowerCase() || "").includes(word) ||
            (d.user?.toLowerCase() || "").includes(word) ||
            (d.device_name?.toLowerCase() || "").includes(word) ||
            (d.brand_name?.toLowerCase() || "").includes(word) ||
            (d.model_name?.toLowerCase() || "").includes(word) ||
            (d.serie?.toLowerCase() || "").includes(word)
        );

        const matchesUbication = !filters.ubication || d.ubication_name === filters.ubication;
        const matchesDepartment = !filters.department || d.department_name === filters.department;
        const matchesTransferDate =
            (!filters.transferdate || new Date(d.transferdate) >= new Date(filters.transferdate));

        return matchesSearch && matchesUbication && matchesDepartment && matchesTransferDate;
    });


    return (
        <div className="p-15">
            {/* Barra de búsqueda */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    {/* Parte izquierda: input y botones de búsqueda/refresh */}
                    <div className="flex flex-wrap items-center gap-6">
                        <input
                            type="text"
                            placeholder="Buscar por Serie, Marbete o Nombre"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border px-2 h-8 rounded text-sm flex-1 min-w-[200px]"
                        />
                        <button
                            onClick={loadDevices}
                            className="flex items-center h-8 gap-1 px-2 text-sm text-white bg-blue-500 rounded"
                        >
                            <Search size={16} /> Buscar
                        </button>

                    </div>

                    {/* Parte derecha: exportar */}
                    {userType === 'admin' && (
                        <button
                            onClick={handleExportDevices}
                            className="h-8 px-2 text-sm font-bold text-white bg-green-500 rounded hover:bg-green-700"
                        >
                            Exportar a Excel
                        </button>
                    )}

                </div>

                {/* Botón para agregar nuevo dispositivo */}
                {userType === 'admin' && (
                    <button
                        onClick={() => setShowInventoryForm(true)}
                        className="flex items-center h-8 gap-1 px-2 text-sm text-white bg-blue-500 rounded"
                    >
                        <Plus size={16} /> Nuevo equipo
                    </button>
                )}

            </div>

            {selectedDevice && (
                <div className="p-4 mb-4 border rounded bg-gray-50">
                    <h3 className="mb-2 font-semibold">Unidad que recibe</h3>

                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium">Rol del técnico:</label>
                        <select
                            value={selectedDevice.role}
                            onChange={e => {
                                const role = e.target.value;
                                setSelectedDevice(prev => ({
                                    ...prev,
                                    role,
                                    userTransfiere: role === 'transfiere' ? authData?.name || 'Técnico no identificado' : prev.userTransfiere || '',
                                    userRecibe: role === 'recibe' ? authData?.name || 'Técnico no identificado' : prev.userRecibe || ''
                                }));
                            }}
                            className="h-8 px-2 text-sm border rounded"
                        >
                            <option value="transfiere">Transfiere</option>
                            <option value="recibe">Recibe</option>
                        </select>
                    </div>

                    <UbiDepSelector
                        id_ubication={selectedDevice.ubication_destino_id}
                        id_department={selectedDevice.department_destino_id}
                        departments={departments || []}
                        onChange={({ id_ubication, id_department, ubication_name, department_name }) => {
                            setSelectedDevice(prev => ({
                                ...prev,
                                ubication_destino_id: id_ubication,
                                department_destino_id: id_department,
                                ubication_destino_name: ubication_name,
                                department_destino_name: department_name
                            }));
                        }}
                    />
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 mt-2 text-white transition bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Imprimir traslado
                    </button>
                </div>
            )}

            {/* Tabla de inventario con botón de edición e impresión */}
            <InventoryTable
                inventory={filteredDevices}
                onPrint={handlePreparePrint}
                onEdit={editDevice}
                authData={authData}
            />

            {/* Modal para editrar equipo */}
            {editingDevice && (
                <InventoryFormModal
                    initialData={editingDevice}
                    onCancel={() => setEditingDevice(null)}
                    onSubmit={(data) => editDeviceConfirm(data)}
                />
            )}

            {/* Modal para agregar nuevo equipo */}
            {showInventoryForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 bg-gray-800 bg-opacity-40">
                    <InventoryFormModal
                        initialData={{}}
                        onCancel={() => setShowInventoryForm(false)}
                        onSubmit={(data) => handleAddDevice(data)}
                    />
                </div>
            )}

            {selectedDevice && (
                <div style={{ display: "none" }}>
                    <TransferPrint
                        ref={printRef}
                        device={{
                            ...selectedDevice,
                            ubication_destino_name: selectedDevice.ubication_destino_name || '',
                            department_destino_name: selectedDevice.department_destino_name || ''
                        }}
                        setDevice={setSelectedDevice}
                        departments={departments || []}
                        fecha={new Date().toLocaleDateString("es-ES")}
                    />
                </div>
            )}

        </div>
    );
}

export default InventoryPage;