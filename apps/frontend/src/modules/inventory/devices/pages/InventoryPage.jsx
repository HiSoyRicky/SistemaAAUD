// src/pages/inventory/InventoryPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Plus,
  History,
  ClipboardList,
  RefreshCw,
  X,
  Download,
  Laptop,
  MapPin,
  PackageCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../../shared/hooks/useAuth';
import api from '../../../../shared/api/apiClient';
import { Inventory } from '../services/inventory.api';
import InventoryTable from '../components/tables/InventoryTable';
import TransferPrint from '../../../../shared/components/Print/DeviceTransferPrint';
import DeletePrint from '../../../../shared/components/Print/DeviceDeletePrint';
import { useReactToPrint } from 'react-to-print';
import { useNotifications } from '../../../../app/providers/NotificationContext';
import { exportInventoryToExcel } from '../../../../shared/utils/exportExcel';
import {
  formatDateTime,
  formatDateToDDMMYYYY,
  toDateOnlyInputValue,
} from '../../../../shared/utils/formatDate';
import PrintWizardModal from '../components/modals/PrintWizardModal';
import InventoryFormModal from '../components/forms/InventoryForm';
import InventoryDetailModal from '../components/modals/InventoryDetailModal';

function formatTransferDate(value) {
  return formatDateTime(value, '-');
}

function getTransferSummary(request) {
  const snapshot = request?.snapshot || {};
  const inventory =
    request?.inventory_snapshot || request?.preview_inventory || {};
  const tag = snapshot.tag || inventory.tag || '-';
  const deviceName = inventory.device_name || snapshot.device_name || 'Equipo';
  const origin = [
    snapshot.ubication_name || inventory.ubication_name,
    snapshot.department_name || inventory.department_name,
  ]
    .filter(Boolean)
    .join(' / ');
  const destination = [
    snapshot.ubication_destino_name,
    snapshot.department_destino_name,
  ]
    .filter(Boolean)
    .join(' / ');

  return {
    tag,
    deviceName,
    brandModel: [inventory.brand_name, inventory.model_name]
      .filter(Boolean)
      .join(' '),
    origin: origin || '-',
    destination: destination || '-',
    requestedAt: formatTransferDate(request?.requested_at),
    userRecibe:
      snapshot.userRecibe || snapshot.userName || inventory.user || '-',
  };
}

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
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingTransfersLoading, setPendingTransfersLoading] = useState(false);
  const [showPendingTransfers, setShowPendingTransfers] = useState(false);
  const [exportDevices, setExportDevices] = useState([]);
  const [inventoryMetrics, setInventoryMetrics] = useState({
    total: 0,
    active: 0,
    warning: 0,
    locations: 0,
  });

  const canTrackPendingTransfers = ['tecnico', 'consultor'].includes(userType);

  const loadPendingTransfers = useCallback(async () => {
    if (!canTrackPendingTransfers) {
      setPendingTransfers([]);
      return;
    }

    try {
      setPendingTransfersLoading(true);
      const response = await Inventory.fetchMyTransferRequests({
        status: 'PENDING',
      });
      setPendingTransfers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Error cargando traslados pendientes:', error);
      addNotification(
        'No se pudieron cargar los traslados pendientes ❌',
        'error'
      );
    } finally {
      setPendingTransfersLoading(false);
    }
  }, [addNotification, canTrackPendingTransfers]);

  const openPrintModal = (device) => {
    if (!device) return;

    setDeviceToPrint({
      ...device,
      role: device.role || 'recibe',
      userName: loggedUserName,
      userTransfiere: device.userTransfiere || '',
      userRecibe: device.userRecibe || '',
      ubication_destino_id: device.ubication_destino_id || null,
      department_destino_id: device.department_destino_id || null,
      ubication_destino_name: device.ubication_destino_name || '',
      department_destino_name: device.department_destino_name || '',
    });

    setPrintModalOpen(true);
  };

  const loadDevices = async (searchTerm = '') => {
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

  useEffect(() => {
    loadPendingTransfers();
  }, [loadPendingTransfers]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      printType === 'transfer'
        ? 'Traslado de dispositivo'
        : 'Descarte de dispositivo',
    onAfterPrint: () => {
      setSelectedDevice(null);
      setPrintType('transfer');
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
        const res = await api.get('/api/departments');
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error cargando departamentos:', error);
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
      department_destino_name: device.department_destino_name || '',
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
    if (
      window.confirm('¿Estás seguro de que deseas agregar este dispositivo?')
    ) {
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
    const dataToExport = exportDevices.length ? exportDevices : filteredDevices;
    exportInventoryToExcel(dataToExport);
  };

  const handleSummaryChange = useCallback((summary) => {
    setInventoryMetrics((prev) => {
      if (
        prev.total === summary.total &&
        prev.active === summary.active &&
        prev.warning === summary.warning &&
        prev.locations === summary.locations
      ) {
        return prev;
      }

      return summary;
    });
  }, []);

  const handleFilteredDataChange = useCallback((rows) => {
    const nextRows = Array.isArray(rows) ? rows : [];

    setExportDevices((prevRows) => {
      if (prevRows.length === nextRows.length) {
        const sameOrderAndIds = prevRows.every(
          (row, index) => row?.id === nextRows[index]?.id
        );

        if (sameOrderAndIds) {
          return prevRows;
        }
      }

      return nextRows;
    });
  }, []);

  const [filters, setFilters] = useState({
    ubication: '',
    department: '',
    status: '',
    transferdate: '',
  });

  const filteredDevices = devices.filter((d) => {
    const searchWords = search
      .toLowerCase()
      .split(' ')
      .filter((w) => w.trim() !== '');

    const toStrLower = (val) =>
      val === null || val === undefined ? '' : String(val).toLowerCase();

    const matchesSearch = searchWords.every(
      (word) =>
        toStrLower(d.ubication_name).includes(word) ||
        toStrLower(d.tag).includes(word) ||
        toStrLower(d.department_name).includes(word) ||
        toStrLower(d.user).includes(word) ||
        toStrLower(d.device_name).includes(word) ||
        toStrLower(d.brand_name).includes(word) ||
        toStrLower(d.model_name).includes(word) ||
        toStrLower(d.ip).includes(word) ||
        toStrLower(d.observation).includes(word) ||
        toStrLower(d.transferdate).includes(word) || // ahora seguro
        toStrLower(d.serie).includes(word)
    );

    const matchesUbication =
      !filters.ubication || d.ubication_name === filters.ubication;
    const matchesDepartment =
      !filters.department || d.department_name === filters.department;
    const matchesTransferDate =
      !filters.transferdate ||
      toDateOnlyInputValue(d.transferdate) >= filters.transferdate;

    return (
      matchesSearch &&
      matchesUbication &&
      matchesDepartment &&
      matchesTransferDate
    );
  });

  return (
    <div className="w-full space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Laptop size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                Inventario de equipos
              </h1>
              <p className="text-sm text-slate-500">
                Consulta, filtra y gestiona los equipos registrados.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canTrackPendingTransfers && (
              <button
                type="button"
                onClick={() => setShowPendingTransfers(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                <ClipboardList size={16} />
                Traslados pendientes
                <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-bold leading-none text-white">
                  {pendingTransfersLoading ? '...' : pendingTransfers.length}
                </span>
              </button>
            )}

            {['admin', 'consultor', 'tecnico'].includes(userType) && (
              <>
                <button
                  type="button"
                  onClick={handleExportDevices}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Download size={16} />
                  Exportar
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/inventario/equipos/history')}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <History size={16} />
                  Historial
                </button>
              </>
            )}

            {userType === 'admin' && (
              <button
                type="button"
                onClick={() => setShowInventoryForm(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={16} />
                Nuevo equipo
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Laptop size={15} />
              Total
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-950">
              {inventoryMetrics.total}
            </div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <PackageCheck size={15} />
              Activos
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">
              {inventoryMetrics.active}
            </div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
              <AlertTriangle size={15} />
              Revisar
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-600">
              {inventoryMetrics.warning}
            </div>
          </div>
          <div className="bg-white px-5 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
              <MapPin size={15} />
              Ubicaciones
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {inventoryMetrics.locations}
            </div>
          </div>
        </div>
      </section>

      <PrintWizardModal
        open={printModalOpen}
        device={deviceToPrint}
        departments={departments}
        authData={authData}
        onClose={() => setPrintModalOpen(false)}
        onPrint={async ({ docType, payload }) => {
          try {
            setPrintType(docType);

            if (docType === 'transfer') {
              await Inventory.createTransferRequest({
                inventory_id: payload.id,
                snapshot: payload,
                requester_id: loggedUserId,
              });
              await loadPendingTransfers();
              addNotification(
                'Solicitud de traslado enviada a aprobación ✅',
                'success'
              );
            }

            setSelectedDevice(payload);
            setPrintModalOpen(false);
            setPendingPrint(true);
          } catch (error) {
            addNotification(
              error.response?.data?.message ||
                'No se pudo registrar la solicitud de traslado ❌',
              'error'
            );
            throw error;
          }
        }}
      />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Listado de equipos
            </h2>
          </div>

          <div className="relative w-full lg:max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por serie, marbete, nombre, IP u observación"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <InventoryTable
          inventory={filteredDevices}
          onPrint={(device) => openPrintModal(device)}
          onEdit={editDevice}
          authData={authData}
          search={search}
          onSummaryChange={handleSummaryChange}
          onFilteredDataChange={handleFilteredDataChange}
          onView={(item) => {
            setSelectedItem(item);
            setShowDetailModal(true);
          }}
        />
      </section>

      <InventoryDetailModal
        isOpen={showDetailModal}
        item={selectedItem}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedItem(null);
        }}
      />

      {showPendingTransfers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="flex w-full max-w-4xl max-h-[88vh] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Traslados pendientes
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-800">
                    {pendingTransfers.length}
                  </span>
                </h2>
                <p className="text-sm text-slate-500">
                  Solicitudes enviadas y pendientes de aprobación.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadPendingTransfers}
                  disabled={pendingTransfersLoading}
                  className="inline-flex h-9 items-center gap-2 rounded border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  Recargar
                </button>
                <button
                  type="button"
                  onClick={() => setShowPendingTransfers(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-auto p-5">
              {pendingTransfersLoading && (
                <div className="py-10 text-center text-sm text-slate-500">
                  Cargando traslados pendientes...
                </div>
              )}

              {!pendingTransfersLoading && pendingTransfers.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                  No tienes traslados pendientes por aprobación.
                </div>
              )}

              {!pendingTransfersLoading && pendingTransfers.length > 0 && (
                <div className="space-y-3">
                  {pendingTransfers.map((request) => {
                    const summary = getTransferSummary(request);

                    return (
                      <div
                        key={request.id}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-slate-900">
                                Marbete {summary.tag}
                              </span>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                Pendiente
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {summary.deviceName}
                              {summary.brandModel
                                ? ` - ${summary.brandModel}`
                                : ''}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            Solicitud #{request.id}
                            <div>{summary.requestedAt}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                          <div>
                            <div className="font-semibold text-slate-700">
                              Origen
                            </div>
                            <div className="text-slate-600">
                              {summary.origin}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-700">
                              Destino
                            </div>
                            <div className="text-slate-600">
                              {summary.destination}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-700">
                              Quién recibe
                            </div>
                            <div className="text-slate-600">
                              {summary.userRecibe}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        <div style={{ display: 'none' }}>
          {printType === 'transfer' ? (
            <TransferPrint
              ref={printRef}
              device={{
                ...selectedDevice,
                ubication_destino_name:
                  selectedDevice.ubication_destino_name || '',
                department_destino_name:
                  selectedDevice.department_destino_name || '',
              }}
              setDevice={setSelectedDevice}
              departments={departments || []}
              fecha={formatDateToDDMMYYYY(new Date(), '-')}
            />
          ) : (
            <DeletePrint
              ref={printRef}
              device={selectedDevice}
              fecha={formatDateToDDMMYYYY(new Date(), '-')}
              userName={loggedUserName}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
