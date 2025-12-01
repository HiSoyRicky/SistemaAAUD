// src/pages/inventory/InventoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Tag, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '@/hooks/useAuth';
import { Inventory } from '@/services/api';
import InventoryTable from '@/components/inventory/tables/InventoryTable';
import TransferPrint from '@/components/Print/TransferPrint';
import DeletePrint from '@/components/Print/DeletePrint';
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
    const [printType, setPrintType] = useState('transfer');

    const loadDevices = async (searchTerm = "") => {
        try {
            const data = await Inventory.fetchDevices(searchTerm);
            setDevices(data);
        } catch (error) {
            console.error('Error al obtener dispositivos:', error);
        }
    };


    useEffect(() => {
        loadDevices(search);
    }, [search]);


    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Traslado de dispositivo",
        onAfterPrint: () => {
            setSelectedDevice(null);
            setPrintType('transfer');
        }
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
            role: 'recibe',
            userName: loggedUserName || 'Técnico no identificado',
            userTransfiere: device.userTransfiere || '',
            userRecibe: device.userRecibe || '',
            ubication_destino_id: device.ubication_destino_id || null,
            department_destino_id: device.department_destino_id || null,
            ubication_destino_name: device.ubication_destino_name || '',
            department_destino_name: device.department_destino_name || ''
        });
    };

    const editDevice = (device) => {
        setEditingDevice(device);
    };

    const editDeviceConfirm = async (updatedData) => {
        try {

            await Inventory.updateDevice(editingDevice.id, updatedData);

            await loadDevices();

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

    const [filters, setFilters] = useState({
        ubication: '',
        department: '',
        status: '',
        transferdate: ''
    });

    const filteredDevices = devices.filter(d => {
        const searchWords = search.toLowerCase().split(" ").filter(w => w.trim() !== "");

        const toStrLower = (val) =>
            val === null || val === undefined
                ? ""
                : String(val).toLowerCase();

        const matchesSearch = searchWords.every(word =>
            toStrLower(d.ubication_name).includes(word) ||
            toStrLower(d.tag).includes(word) ||
            toStrLower(d.department_name).includes(word) ||
            toStrLower(d.user).includes(word) ||
            toStrLower(d.device_name).includes(word) ||
            toStrLower(d.brand_name).includes(word) ||
            toStrLower(d.model_name).includes(word) ||
            toStrLower(d.transferdate).includes(word) ||   // ahora seguro
            toStrLower(d.serie).includes(word)
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

                    {/* Parte izquierda: input y botones de búsqueda */}
                    <div className="flex flex-wrap items-center gap-6">
                        <input
                            type="text"
                            placeholder="Buscar por Serie, Marbete o Nombre"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                            }}
                            className="border px-3 h-8 rounded text-sm flex-1 min-w-[300px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                            onClick={() => loadDevices(search)}
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
                    <h3 className="mb-2 font-semibold">
                        {printType === 'transfer'
                            ? 'Unidad que recibe'
                            : 'Generar documento de descarte'}
                    </h3>

                    {/* Campos SOLO para traslado */}
                    {printType === 'transfer' && (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-sm font-medium">Rol del técnico:</label>
                                <select
                                    value={selectedDevice.role}
                                    onChange={e => {
                                        const role = e.target.value;
                                        setSelectedDevice(prev => ({
                                            ...prev,
                                            role,
                                            userTransfiere: role === 'transfiere'
                                                ? authData?.name || 'Técnico no identificado'
                                                : prev.userTransfiere || '',
                                            userRecibe: role === 'recibe'
                                                ? authData?.name || 'Técnico no identificado'
                                                : prev.userRecibe || ''
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
                        </>
                    )}

                    {/* Bloque resumen para DESCARTE */}
                    {printType === 'delete' && (
                        <div className="p-3 mt-3 text-sm bg-gray-100 border rounded">
                            <p className="mb-1 font-medium text-gray-700">Resumen del dispositivo seleccionado:</p>
                            <ul className="space-y-1 text-gray-600">
                                <li><strong>Marbete:</strong> {selectedDevice.tag || 'Sin número de marbete'}</li>
                                <li><strong>Equipo:</strong> {selectedDevice.device_name || 'Desconocido'}</li>
                                <li><strong>Marca / Modelo:</strong> {selectedDevice.brand_name || '-'} {selectedDevice.model_name || ''}</li>
                                <li><strong>Serie:</strong> {selectedDevice.serie || 'No especificada'}</li>
                                <li><strong>Ubicación actual:</strong> {selectedDevice.ubication_name || 'Sin ubicación'}</li>
                                <li><strong>Departamento:</strong> {selectedDevice.department_name || 'Sin departamento'}</li>
                            </ul>
                        </div>
                    )}

                    {/* Selector tipo de impresión y botón */}
                    <div className="flex items-center gap-3 mt-3">
                        <select
                            value={printType}
                            onChange={(e) => setPrintType(e.target.value)}
                            className="h-8 px-2 text-sm border rounded"
                        >
                            <option value="transfer">Traslado</option>
                            <option value="delete">Descarte</option>
                        </select>

                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 text-white transition bg-blue-600 rounded hover:bg-blue-700"
                        >
                            {printType === 'transfer' ? 'Imprimir traslado' : 'Imprimir descarte'}
                        </button>
                    </div>
                </div>
            )}



            {/* Tabla de inventario con botón de edición e impresión */}
            <InventoryTable
                inventory={filteredDevices}
                onPrint={handlePreparePrint}
                onEdit={editDevice}
                authData={authData}
                search={search}
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
                    {printType === 'transfer' ? (
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
                    ) : (
                        <DeletePrint
                            ref={printRef}
                            device={selectedDevice}
                            fecha={new Date().toLocaleDateString("es-ES")}
                            userName={loggedUserName || 'Técnico no identificado'}
                        />
                    )}
                </div>
            )}


        </div>
    );
}

export default InventoryPage;