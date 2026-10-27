// InventoryPage.jsx

import {
  AlertTriangle,
  ClipboardList,
  Download,
  History,
  Laptop,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import { useNotifications } from '../../../../app/providers/NotificationContext';
import api from '../../../../shared/api/apiClient';
import DeletePrint from '../../../../shared/components/Print/DeviceDeletePrint';
import TransferPrint from '../../../../shared/components/Print/DeviceTransferPrint';
import useAuth from '../../../../shared/hooks/useAuth';
import { exportInventoryToExcel } from '../../../../shared/utils/exportExcel';
import { formatDateTime, formatDateToDDMMYYYY } from '../../../../shared/utils/formatDate';
import InventoryFormModal from '../components/forms/InventoryForm';
import InventoryDetailModal from '../components/modals/InventoryDetailModal';
import InventoryDuplicatesModal from '../components/modals/InventoryDuplicatesModal';
import PrintWizardModal from '../components/modals/PrintWizardModal';
import InventoryTable from '../components/tables/InventoryTable';
import { Inventory } from '../services/inventory.api';
import ModalLayer from '../../../../shared/components/ui/ModalLayer';

function formatTransferDate(value) {
  return formatDateTime(value, '-');
}

function getTransferSummary(request) {
  const snapshot = request?.snapshot || {};
  const inventory = request?.inventory_snapshot || request?.preview_inventory || {};
  const tag = snapshot.tag || inventory.tag || '-';
  const deviceName = inventory.device_name || snapshot.device_name || 'Equipo';
  const origin = [
    snapshot.ubication_name || inventory.ubication_name,
    snapshot.department_name || inventory.department_name,
  ]
    .filter(Boolean)
    .join(' / ');
  const destination = [snapshot.ubication_destino_name, snapshot.department_destino_name]
    .filter(Boolean)
    .join(' / ');

  return {
    tag,
    deviceName,
    brandModel: [inventory.brand_name, inventory.model_name].filter(Boolean).join(' '),
    origin: origin || '-',
    destination: destination || '-',
    requestedAt: formatTransferDate(request?.requested_at),
    userRecibe: snapshot.userRecibe || snapshot.userName || inventory.user || '-',
  };
}

const SELECT_FILTER_KEYS = [
  'ubication_name',
  'department_name',
  'administrative_area_name',
  'device_name',
  'brand_name',
  'model_name',
  'status_name',
  'asset_type_name',
];

function InventoryPage({ scope = 'equipos' }) {
  const navigate = useNavigate();
  const { authData, userType, loggedUserName, loggedUserId, hasPermission } = useAuth();

  const canCreateInventory = hasPermission('inventory.create');
  const canRequestInventory = hasPermission('inventory.read');
  const [search, setSearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryLimit, setInventoryLimit] = useState(20);
  const [inventoryMeta, setInventoryMeta] = useState({ total: 0, totalPages: 1 });
  const [inventoryFilters, setInventoryFilters] = useState({
    ubication_name: '',
    department_name: '',
    administrative_area_name: '',
    user: '',
    device_name: '',
    brand_name: '',
    model_name: '',
    status_name: '',
    asset_type_name: '',
  });
  const [departments, setDepartments] = useState([]);
  const [administrativeAreas, setAdministrativeAreas] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [devices, setDevices] = useState([]);
  const deviceRequest = useRef(0);
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
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingTransfersLoading, setPendingTransfersLoading] = useState(false);
  const [showPendingTransfers, setShowPendingTransfers] = useState(false);
  const [inventoryMetrics, setInventoryMetrics] = useState({
    total: 0,
    active: 0,
    warning: 0,
    locations: 0,
  });

  const canTrackPendingTransfers = hasPermission('inventory_transfers.read_own');
  const canCreateTransfers = hasPermission('inventory_transfers.create');

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
      addNotification('No se pudieron cargar los traslados pendientes', 'error');
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
      technicianName: loggedUserName,
      userTransfiere: device.userTransfiere || '',
      userRecibe: device.userRecibe || '',
      ubication_destino_id: device.ubication_destino_id || null,
      department_destino_id: device.department_destino_id || null,
      ubication_destino_name: device.ubication_destino_name || '',
      department_destino_name: device.department_destino_name || '',
      administrative_area_destino_id: device.id_administrative_area || null,
      administrative_area_destino_name: device.administrative_area_name || '',
    });

    setPrintModalOpen(true);
  };

  const loadDevices = async (searchTerm = '') => {
    const requestId = ++deviceRequest.current;
    try {
      const queryFilters = {
        ubication: inventoryFilters.ubication_name,
        department: inventoryFilters.department_name,
        administrative_area: inventoryFilters.administrative_area_name,
        user: inventoryFilters.user,
        device: inventoryFilters.device_name,
        brand: inventoryFilters.brand_name,
        model: inventoryFilters.model_name,
        status: inventoryFilters.status_name,
        asset_type: inventoryFilters.asset_type_name,
      };
      const response = await Inventory.fetchDevices(searchTerm, {
        page: inventoryPage,
        limit: inventoryLimit,
        ...queryFilters,
      });
      if (requestId !== deviceRequest.current) return;
      const data = Array.isArray(response) ? response : response?.data || [];
      setDevices(data);
      setInventoryMeta({
        total: Number(response?.total) || data.length,
        totalPages: Number(response?.totalPages) || 1,
        stats: response?.stats || null,
      });
    } catch (error) {
      if (requestId !== deviceRequest.current) return;
      console.error('Error al obtener dispositivos:', error);
      toast.error('No se pudo cargar el inventario');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void loadDevices(search), 250);
    return () => { clearTimeout(timer); deviceRequest.current += 1; };
  }, [search, inventoryPage, inventoryLimit, inventoryFilters]);

  useEffect(() => {
    setInventoryPage(1);
  }, [search, inventoryFilters]);

  useEffect(() => {
    void loadPendingTransfers();
  }, [loadPendingTransfers]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printType === 'transfer' ? 'Traslado de dispositivo' : 'Descarte de dispositivo',
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
    void fetchDepartments();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchFilterOptions = async () => {
      try {
        const data = await Inventory.fetchFilterOptions({
          search,
          ubication: inventoryFilters.ubication_name,
          department: inventoryFilters.department_name,
          administrative_area: inventoryFilters.administrative_area_name,
          user: inventoryFilters.user,
          device: inventoryFilters.device_name,
          brand: inventoryFilters.brand_name,
          model: inventoryFilters.model_name,
          status: inventoryFilters.status_name,
          asset_type: inventoryFilters.asset_type_name,
        });
        if (cancelled) return;

        const nextOptions = {
          ubication_name: (data.ubications || []).map((item) => item.name),
          department_name: (data.departments || []).map((item) => item.name),
          administrative_area_name: (data.administrative_areas || []).map((item) => item.name),
          user: data.users || [],
          device_name: (data.devices || []).map((item) => item.name),
          brand_name: (data.brands || []).map((item) => item.name),
          model_name: (data.models || []).map((item) => item.name),
          status_name: (data.statuses || []).map((item) => item.name),
          asset_type_name: (data.asset_types || []).map((item) => item.name),
        };

        setFilterOptions(nextOptions);
        setAdministrativeAreas(data.administrative_areas || []);

        const staleKeys = SELECT_FILTER_KEYS.filter(
          (key) => inventoryFilters[key] && !nextOptions[key].includes(inventoryFilters[key])
        );

        if (staleKeys.length) {
          setInventoryFilters((prev) => {
            const cleared = staleKeys.filter((key) => prev[key] === inventoryFilters[key]);

            return cleared.length
              ? { ...prev, ...Object.fromEntries(cleared.map((key) => [key, ''])) }
              : prev;
          });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error al obtener opciones de filtro:', error);
      }
    };

    const timer = setTimeout(() => void fetchFilterOptions(), 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [
    search,
    inventoryFilters.ubication_name,
    inventoryFilters.department_name,
    inventoryFilters.administrative_area_name,
    inventoryFilters.user,
    inventoryFilters.device_name,
    inventoryFilters.brand_name,
    inventoryFilters.model_name,
    inventoryFilters.status_name,
    inventoryFilters.asset_type_name,
  ]);

  const editDevice = (device) => {
    setEditingDevice(device);
  };

  const editDeviceConfirm = async (updatedData) => {
    try {
      await Inventory.updateDevice(editingDevice.id, updatedData);

      // Mantiene la búsqueda y los filtros activos tras guardar los cambios.
      await loadDevices(search);

      setEditingDevice(null);

      addNotification('Dispositivo actualizado con éxito ✅', 'success');
    } catch (error) {
      console.error('Error al actualizar dispositivo:', error);
      addNotification(
        error.response?.data?.message || 'Error al actualizar dispositivo ❌',
        'error'
      );
    }
  };

  const handleAddDevice = async (formData) => {
    const confirmation = canCreateInventory
      ? '¿Estás seguro de que deseas agregar este dispositivo?'
      : '¿Enviar esta propuesta de activo al administrador para revisión?';
    if (window.confirm(confirmation)) {
      setShowInventoryForm(false);
      try {
        if (!canCreateInventory) {
          await Inventory.requestCreation('INVENTORY', formData);
          toast.success('Solicitud enviada al administrador para revisión');
          return;
        }
        const result = await Inventory.addDevice(formData);
        const createdInventory = result?.inventory || result;
        setDevices((currentDevices) => [...currentDevices, createdInventory]);
        toast.success('Dispositivo agregado con éxito');
      } catch (error) {
        console.error('Error al agregar dispositivo:', error);
        toast.error(error.response?.data?.message || 'Error al enviar la solicitud');
      }
    }
  };

  const handleExportDevices = async () => {
    const response = await Inventory.fetchDevices(search, {
      ubication: inventoryFilters.ubication_name,
      department: inventoryFilters.department_name,
      administrative_area: inventoryFilters.administrative_area_name,
      user: inventoryFilters.user,
      device: inventoryFilters.device_name,
      brand: inventoryFilters.brand_name,
      model: inventoryFilters.model_name,
      status: inventoryFilters.status_name,
    });
    const dataToExport = Array.isArray(response) ? response : response?.data || [];
    await exportInventoryToExcel(dataToExport);
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

  const filteredDevices = devices;

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
                {scope === 'bienes' ? 'Bienes patrimoniales' : 'Inventario de equipos'}
              </h1>
              <p className="text-sm text-slate-500">
                {scope === 'bienes'
                  ? 'Consulta, filtra y traslada los bienes patrimoniales registrados.'
                  : 'Consulta, filtra y gestiona los equipos registrados.'}
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

            {(canCreateInventory || canRequestInventory) && (
              <button
                type="button"
                onClick={() => setShowInventoryForm(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={16} />
                {canCreateInventory ? 'Nuevo equipo' : 'Solicitar alta de activo'}
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
            <div className="mt-2 text-3xl font-bold text-slate-950">{inventoryMetrics.total}</div>
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
            <div className="mt-2 text-3xl font-bold text-amber-600">{inventoryMetrics.warning}</div>
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
        allowTransfer={canCreateTransfers}
        device={deviceToPrint}
        departments={departments}
        administrativeAreas={administrativeAreas}
        authData={authData}
        onClose={() => setPrintModalOpen(false)}
        onPrint={async ({ docType, payload }) => {
          try {
            setPrintType(docType);

            if (docType === 'transfer') {
              await Inventory.createTransferRequest({
                item_id: payload.id,
                snapshot: payload,
                requester_id: loggedUserId,
              });
              await loadPendingTransfers();
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

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Listado de activos</h2>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-3xl lg:justify-end">
            {(inventoryMeta.stats?.duplicateTags?.length > 0 ||
              inventoryMeta.stats?.duplicateSeries?.length > 0) && (
              <button
                type="button"
                onClick={() => setShowDuplicatesModal(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800 hover:bg-red-100"
              >
                <AlertTriangle size={16} />
                Revisar duplicados
                <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs text-white">
                  {(inventoryMeta.stats.duplicateTags?.length || 0) +
                    (inventoryMeta.stats.duplicateSeries?.length || 0)}
                </span>
              </button>
            )}
            <div className="relative w-full lg:max-w-xl">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar por marbete, serie, nombre, IP u observación"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>
        </div>

        <InventoryTable
          inventory={filteredDevices}
          scope={scope}
          onPrint={(device) => openPrintModal(device)}
          onEdit={editDevice}
          authData={authData}
          search={search}
          onSummaryChange={handleSummaryChange}
          serverPagination
          currentPage={inventoryPage}
          totalPages={inventoryMeta.totalPages}
          serverTotal={inventoryMeta.total}
          serverSummary={inventoryMeta.stats}
          pageSize={inventoryLimit}
          onPageChange={setInventoryPage}
          onPageSizeChange={(size) => {
            setInventoryLimit(size);
            setInventoryPage(1);
          }}
          serverFilters={inventoryFilters}
          onFiltersChange={(nextFilters) => {
            setInventoryFilters(nextFilters);
            setInventoryPage(1);
          }}
          filterOptions={filterOptions}
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

      <InventoryDuplicatesModal
        open={showDuplicatesModal}
        onClose={() => setShowDuplicatesModal(false)}
        onSearchGroup={(value) => {
          setSearch(value);
          setInventoryPage(1);
          setShowDuplicatesModal(false);
        }}
        duplicateTags={inventoryMeta.stats?.duplicateTags || []}
        duplicateSeries={inventoryMeta.stats?.duplicateSeries || []}
      />

      {showPendingTransfers && (
        <ModalLayer>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md">
          <div className="flex w-full max-w-4xl max-h-[88vh] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Traslados pendientes {''}
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
                              {summary.brandModel ? ` - ${summary.brandModel}` : ''}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            Solicitud #{request.id}
                            <div>{summary.requestedAt}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                          <div>
                            <div className="font-semibold text-slate-700">Origen</div>
                            <div className="text-slate-600">{summary.origin}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-700">Destino</div>
                            <div className="text-slate-600">{summary.destination}</div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-700">Quién recibe</div>
                            <div className="text-slate-600">{summary.userRecibe}</div>
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
        </ModalLayer>
      )}

      {/* Modal para editar equipo */}
      {editingDevice && (
        <InventoryFormModal
          initialData={editingDevice}
          onCancel={() => setEditingDevice(null)}
          onSubmit={(data) => editDeviceConfirm(data)}
        />
      )}

      {/* Modal para agregar nuevo equipo */}
      {showInventoryForm && (
        <InventoryFormModal
          initialData={{}}
          onCancel={() => setShowInventoryForm(false)}
          onSubmit={(data) => handleAddDevice(data)}
        />
      )}

      {selectedDevice && (
        <div style={{ display: 'none' }}>
          {printType === 'transfer' ? (
            <TransferPrint
              ref={printRef}
              device={{
                ...selectedDevice,
                ubication_destino_name: selectedDevice.ubication_destino_name || '',
                department_destino_name: selectedDevice.department_destino_name || '',
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
