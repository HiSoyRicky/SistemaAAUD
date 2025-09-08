// src/pages/inventory/InventoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Tag } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { fetchDevice as apiFetchDevices, updateDevice } from '../../services/api';
import InventoryTable from '../../components/inventory/InventoryTable';
import TransferPrint from '../../components/TransferPrint';
import EditEquipmentModal from '../../components/inventory/EditEquipmentModal';
import { useReactToPrint } from "react-to-print";
import { useNotifications } from '../../context/NotificationContext';
import { exportInventoryToExcel } from '../../utils/exportExcel';
import { addDevice } from '../../services/api';
import InventoryForm from '../../components/inventory/InventoryForm';
import UbiDepSelector from '../../components/UbiDepSelector';

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
            const data = await apiFetchDevices(search);
            setDevices(data);
        } catch (error) {
            console.error('Error al obtener dispositivos:', error);
        } finally {
        }
    };

    useEffect(() => {
        loadDevices();
    }, [search]);

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


    const handleEdit = (device) => {
        console.log('Equipo seleccionado para editar:', device);
        setEditingDevice(device);
    };

    const handleEditConfirm = async (updatedData) => {
        try {
            await updateDevice(editingDevice.id, updatedData);
            setDevices(devices.map(device =>
                device.id === editingDevice.id ? { ...device, ...updatedData } : device
            ));
            setEditingDevice(null);
            addNotification('Dispositivo actualizado con éxito ✅', 'success');
        } catch (error) {
            console.error('Error al actualizar dispositivo:', error);
            addNotification('Error al actualizar dispositivo ❌', 'error');
        }
    };

    const handleAddDevice = async (formData) => {
        if (window.confirm('¿Estás seguro de que deseas agregar este dispositivo?')) {
            try {
                const result = await addDevice(formData);
                setDevices([...devices, { id: result.id, ...formData }]);
                setShowInventoryForm(false);
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
        const matchesUbication = !filters.ubication || d.ubication_name === filters.ubication;
        const matchesDepartment = !filters.department || d.department_name === filters.department;
        const matchesTransferDate =
            (!filters.transferdate || new Date(d.transferdate) >= new Date(filters.transferdate));
        return matchesUbication && matchesDepartment && matchesTransferDate;
    });



    return (
        <div className="p-15">
            {/* Barra de búsqueda */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    {/* Parte izquierda: input y botones de búsqueda/refresh */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <input
                            type="text"
                            placeholder="Buscar por Serie, Marbete o Nombre"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border px-2 h-8 rounded text-sm flex-1 min-w-[200px]"
                        />
                        <button
                            onClick={loadDevices}
                            className="bg-blue-500 text-white px-2 h-8 rounded flex items-center gap-1 text-sm"
                        >
                            <Search size={16} /> Buscar
                        </button>

                    </div>

                    {/* Parte derecha: exportar */}
                    {userType === 'admin' && (
                        <button
                            onClick={handleExportDevices}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold px-2 h-8 rounded text-sm"
                        >
                            Exportar a Excel
                        </button>
                    )}

                </div>

                {/* Botón para agregar nuevo dispositivo */}
                {userType === 'admin' && (
                    <button
                        onClick={() => setShowInventoryForm(true)}
                        className="bg-blue-500 text-white px-2 h-8 rounded flex items-center gap-1 text-sm"
                    >
                        <Plus size={16} /> Nuevo equipo
                    </button>
                )}

            </div>

            {selectedDevice && (
                <div className="mb-4 p-4 border rounded bg-gray-50">
                    <h3 className="font-semibold mb-2">Unidad que recibe</h3>

                    <div className="flex gap-2 mb-2 items-center">
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
                            className="border px-2 h-8 rounded text-sm"
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
                        className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 transition"
                    >
                        Imprimir traslado
                    </button>
                </div>
            )}

            {/* Tabla de inventario con botón de edición e impresión */}
            <InventoryTable
                inventory={filteredDevices}
                onPrint={handlePreparePrint}
                onEdit={handleEdit}
                authData={authData}
            />

            {/* Modal de edición */}
            {editingDevice && (
                <EditEquipmentModal
                    device={editingDevice}
                    onClose={() => setEditingDevice(null)}
                    onConfirm={handleEditConfirm}
                />
            )}

            {showInventoryForm && (
                <InventoryForm
                    onSubmit={handleAddDevice}
                    onCancel={() => setShowInventoryForm(false)}
                />
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