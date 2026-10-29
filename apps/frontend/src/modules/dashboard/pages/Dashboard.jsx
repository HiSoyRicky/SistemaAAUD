// Dashboard.jsx

import { useEffect, useState } from 'react';
import useAuth from '../../../shared/hooks/useAuth';
import { Incidents } from '../../incidents/services/incidents.api.js';
import { Inventory } from '../../inventory/devices/services/inventory.api.js';
import { Toners } from '../../inventory/toners/services/toners.api.js';
import Warehouse from '../../warehouse/services/warehouse.api.js';
import { AlertTriangle, Boxes, LoaderCircle, Package, Printer } from 'lucide-react';
import IncidentsSection from '../components/IncidentsSection.jsx';
import InventorySection from '../components/InventorySection.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import StatCard from '../components/StatCard.jsx';

export default function Dashboard() {
  const { hasPermission } = useAuth();
  const canSeeIncidents = hasPermission('incidents.read');
  const canSeeInventory = hasPermission('inventory.read');
  const canSeeToners = hasPermission('toners.read');
  const canSeeWarehouse = hasPermission('warehouse_stock.read');

  const [incidences, setIncidences] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loadingIncidences, setLoadingIncidences] = useState(canSeeIncidents);
  const [loadingInventory, setLoadingInventory] = useState(canSeeInventory);
  const [toners, setToners] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [loadingToners, setLoadingToners] = useState(canSeeToners);
  const [loadingWarehouse, setLoadingWarehouse] = useState(canSeeWarehouse);
  const [errors, setErrors] = useState([]);

  const loadIncidences = async () => {
    setLoadingIncidences(true);
    try {
      const data = await Incidents.fetchAll();
      setIncidences(Array.isArray(data) ? data : []);
    } catch {
      setErrors((prev) => [...prev, 'incidencias']);
    } finally {
      setLoadingIncidences(false);
    }
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await Inventory.fetchDevices();
      setInventory(Array.isArray(data) ? data : []);
    } catch {
      setErrors((prev) => [...prev, 'equipos']);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        canSeeIncidents ? loadIncidences() : Promise.resolve(),
        canSeeInventory ? loadInventory() : Promise.resolve(),
        canSeeToners ? Toners.fetchAll().then(setToners).catch(() => setErrors((prev) => [...prev, 'tóner'])).finally(() => setLoadingToners(false)) : Promise.resolve(),
        canSeeWarehouse ? Warehouse.fetchStockSummary().then(setWarehouse).catch(() => setErrors((prev) => [...prev, 'almacén'])).finally(() => setLoadingWarehouse(false)) : Promise.resolve(),
      ]);
    };

    load();
    // Solo se ejecuta al montar: los permisos no cambian durante la sesión activa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      <main className="w-full min-w-0 pt-6 pb-12">
        <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-500">Resumen general de incidencias e inventario</p>
            </div>

            <div className="text-xs text-slate-500">
              {loadingIncidences || loadingInventory || loadingToners || loadingWarehouse ? 'Cargando datos...' : errors.length ? 'Algunos datos no están disponibles' : 'Datos cargados ✅'}
            </div>
          </div>

          {(loadingIncidences || loadingInventory || loadingToners || loadingWarehouse) && (
            <div role="status" className="flex items-center gap-4 p-5 mb-6 border shadow-sm bg-white/90 border-indigo-100 rounded-2xl">
              <LoaderCircle className="w-7 h-7 text-indigo-600 animate-spin" aria-hidden="true" />
              <div><p className="font-semibold text-slate-800">Preparando tu panel</p><p className="text-sm text-slate-500">Estamos reuniendo la información disponible para ti.</p></div>
            </div>
          )}
          {errors.length > 0 && <div role="alert" className="p-4 mb-6 text-sm text-amber-800 border border-amber-200 bg-amber-50 rounded-2xl">No se pudo cargar: {errors.join(', ')}. Intenta actualizar la página.</div>}
          {canSeeIncidents && !errors.includes('incidencias') && (
            <IncidentsSection incidences={incidences} loading={loadingIncidences} />
          )}
          {canSeeInventory && !errors.includes('equipos') && <InventorySection inventory={inventory} loading={loadingInventory} />}
          {canSeeToners && !errors.includes('tóner') && <section className="p-6 mt-10 bg-white border shadow-sm border-slate-200 rounded-3xl">
            <SectionHeader title="Inventario de tóner" desc="Existencias y modelos que requieren reposición" icon={Printer} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <StatCard title="Modelos registrados" value={loadingToners ? '...' : toners.length} icon={Printer} gradient="from-violet-500 to-violet-800" />
              <StatCard title="Unidades disponibles" value={loadingToners ? '...' : toners.reduce((sum, toner) => sum + Number(toner.stock || 0), 0)} icon={Boxes} gradient="from-teal-400 to-teal-700" />
              <StatCard title="Stock bajo" value={loadingToners ? '...' : toners.filter((toner) => toner.low_stock).length} icon={AlertTriangle} gradient="from-amber-400 to-amber-600" />
            </div>
          </section>}
          {canSeeWarehouse && !errors.includes('almacén') && <section className="p-6 mt-10 bg-white border shadow-sm border-slate-200 rounded-3xl">
            <SectionHeader title="Almacén" desc="Resumen de existencias de insumos" icon={Package} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <StatCard title="Insumos en inventario" value={loadingWarehouse ? '...' : warehouse?.items ?? 0} icon={Package} gradient="from-indigo-500 to-indigo-700" />
              <StatCard title="Insumos disponibles" value={loadingWarehouse ? '...' : warehouse?.availableItems ?? 0} icon={Boxes} gradient="from-emerald-400 to-emerald-700" />
              <StatCard title="Insumos sin existencias" value={loadingWarehouse ? '...' : (warehouse?.items ?? 0) - (warehouse?.availableItems ?? 0)} icon={Boxes} gradient="from-sky-400 to-sky-700" />
            </div>
          </section>}
          {!canSeeIncidents && !canSeeInventory && !canSeeToners && !canSeeWarehouse && (
            <p className="text-sm text-slate-500">No tienes permisos para ver este panel.</p>
          )}
        </div>
      </main>
    </div>
  );
}
