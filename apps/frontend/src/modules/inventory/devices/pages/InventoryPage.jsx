// src/pages/inventory/InventoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, History } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../../shared/hooks/useAuth';
import api from '../../../../shared/api/apiClient';
import { Inventory } from '../services/inventory.api';
import InventoryTable from '../components/tables/InventoryTable';
import TransferPrint from '../../../../shared/components/Print/DeviceTransferPrint';
import DeletePrint from '../../../../shared/components/Print/DeviceDeletePrint';
import { useReactToPrint } from "react-to-print";
import { useNotifications } from '../../../../app/providers/NotificationContext';
import { exportInventoryToExcel } from '../../../../shared/utils/exportExcel';
import PrintWizardModal from '../components/modals/PrintWizardModal';
import InventoryFormModal from '../components/forms/InventoryForm';
import InventoryDetailModal from '../components/modals/InventoryDetailModal';

function InventoryPage() {
    const navigate = useNavigate();
    const { authData, userType, loggedUserName, loggedUserId } = useAuth();
    const [search, setSearch] = useState('');
    const [departments, setDepartments] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showInventoryForm, setShowInventoryForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const printRef = useRef();
    const { addNotification } = useNotifications();
    const [printType, setPrintType] = useState('transfer');

    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [deviceToPrint, setDeviceToPrint] = useState(null);

    const [pendingPrint, setPendingPrint] = useState(false);

    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const openPrintModal = (device) => {
        if (!device) return;

        setDeviceToPrint({
            ...device,
            role: device.role || "recibe",
            userName: loggedUserName,
            userTransfiere: device.userTransfiere || "",
            userRecibe: device.userRecibe || "",
            ubication_destino_id: device.ubication_destino_id || null,
            department_destino_id: device.department_destino_id || null,
            ubication_destino_name: device.ubication_destino_name || "",
            department_destino_name: device.department_destino_name || "",
        });

        setPrintModalOpen(true);
    };


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
        documentTitle: printType === "transfer" ? "Traslado de dispositivo" : "Descarte de dispositivo",
        onAfterPrint: () => {
            setSelectedDevice(null);
            setPrintType("transfer");
        },
    });

    useEffect(() => {
        if (!pendingPrint) return;
        if (!selectedDevice) return;

        handlePrint();
        setPendingPrint(false);
    }, [pendingPrint, selectedDevice, handlePrint]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await api.get("/api/departments");
                setDepartments(Array.isArray(res.data) ? res.data : []);
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
            userName: loggedUserName,
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
            toStrLower(d.ip).includes(word) ||
            toStrLower(d.observation).includes(word) ||
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
                            placeholder="Buscar por serie, marbete, nombre, IP u observación"
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
                    {["admin", "consultor", "tecnico"].includes(userType) && (
                        <button
                            onClick={handleExportDevices}
                            className="h-8 px-2 text-sm font-bold text-white bg-green-500 rounded hover:bg-green-700"
                        >
                            Exportar a Excel
                        </button>
                    )}

                </div>

                <div className="flex items-center gap-2">
                    {['admin', 'consultor', 'tecnico'].includes(userType) && (
                        <button
                            onClick={() => navigate('/inventario/equipos/history')}
                            className="flex items-center h-8 gap-1 px-2 text-sm text-white bg-slate-600 rounded hover:bg-slate-700"
                        >
                            <History size={16} /> Historial
                        </button>
                    )}

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

            </div>

            <PrintWizardModal
                open={printModalOpen}
                device={deviceToPrint}
                departments={departments}
                authData={authData}
                onClose={() => setPrintModalOpen(false)}
                onPrint={async ({ docType, payload }) => {
                    try {
                        setPrintType(docType);

                        if (docType === "transfer") {
                            await Inventory.createTransferRequest({
                                inventory_id: payload.id,
                                snapshot: payload,
                                requester_id: loggedUserId,
                            });
                            addNotification('Solicitud de traslado enviada a aprobación ✅', 'success');
                        }

                        setSelectedDevice(payload);
                        setPrintModalOpen(false);
                        setPendingPrint(true);
                    } catch (error) {
                        addNotification(
                            error.response?.data?.message || 'No se pudo registrar la solicitud de traslado ❌',
                            'error'
                        );
                        throw error;
                    }
                }}
            />

            {/* Tabla de inventario*/}
            <InventoryTable
                inventory={filteredDevices}
                onPrint={(device) => openPrintModal(device)}
                onEdit={editDevice}
                authData={authData}
                search={search}
                onView={(item) => {
                    setSelectedItem(item);
                    setShowDetailModal(true);
                }}
            />

            <InventoryDetailModal
                isOpen={showDetailModal}
                item={selectedItem}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                }}
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
                            userName={loggedUserName}
                        />
                    )}
                </div>
            )}


        </div>
    );
}

export default InventoryPage;
