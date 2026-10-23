// InventoryDetailModal.jsx

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, X, CarFront, Cpu, Building2, MapPin, ShieldCheck, Info } from 'lucide-react';
import {
  formatDateOnlyToDDMMYYYY,
  formatDateToDDMMYYYY,
} from '../../../../../shared/utils/formatDate';
import Pagination from '../../../../../shared/components/ui/Pagination';
import { Inventory } from '../../services/inventory.api';

function textOrDash(value) {
  if (value === null || value === undefined) return '-';

  if (value && typeof value === 'object') {
    return (
      value.name || value.label || value.title || value.nombre_completo || value.username || '-'
    );
  }

  const text = String(value).trim();
  return text === '' ? '-' : text;
}

function TransitionText({ from, to }) {
  const fromText = textOrDash(from);
  const toText = textOrDash(to);

  if (fromText === toText) {
    return <span>{toText}</span>;
  }

  return (
    <div className="flex flex-col leading-tight text-center">
      <span className="text-red-600 line-through">{fromText}</span>
      <span className="text-gray-400">→</span>
      <span className="text-emerald-700">{toText}</span>
    </div>
  );
}

function classificationText(value) {
  return textOrDash(value?.classification?.description || value?.classification?.code_new || value);
}

function InventoryDetailModal({ isOpen, onClose, item }) {
  const [historyRows, setHistoryRows] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyRetry, setHistoryRetry] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadHistoryByDevice() {
      if (!isOpen || !item?.id) {
        setHistoryRows([]);
        setHistoryError('');
        setHistoryPage(1);
        setHistoryTotalPages(1);
        setHistoryTotal(0);
        return;
      }

      try {
        setLoadingHistory(true);
        setHistoryError('');
        const response = await Inventory.fetchMovementHistory({
          inventoryId: item.id,
          page: historyPage,
          limit: 10,
        });

        if (!active) return;
        setHistoryRows(Array.isArray(response?.data) ? response.data : []);
        setHistoryPage(Math.max(Number(response?.page) || 1, 1));
        setHistoryTotalPages(Math.max(Number(response?.totalPages) || 1, 1));
        setHistoryTotal(Number(response?.total) || 0);
      } catch (error) {
        console.error('Error cargando historial del equipo:', error);
        if (active) {
          setHistoryRows([]);
          setHistoryTotalPages(1);
          setHistoryTotal(0);
          setHistoryError(
            error.response?.data?.message || 'No fue posible cargar el historial del equipo.'
          );
        }
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    void loadHistoryByDevice();

    return () => {
      active = false;
    };
  }, [isOpen, item?.id, historyPage, historyRetry]);

  const locationHistory = useMemo(() => {
    return historyRows.filter((row) => {
      const hasUserChange = textOrDash(row.previous_user) !== textOrDash(row.new_user);
      const hasUbicationChange =
        textOrDash(row.previous_ubication) !== textOrDash(row.new_ubication);
      const hasDepartmentChange =
        textOrDash(row.previous_department) !== textOrDash(row.new_department);
      const hasAdministrativeAreaChange =
        textOrDash(row.previous_administrative_area) !== textOrDash(row.new_administrative_area);
      const hasClassificationChange =
        classificationText(row.previous_classification_rule) !==
        classificationText(row.new_classification_rule);
      const hasTechnologyChange = [
        ['previous_device', 'new_device'],
        ['previous_brand', 'new_brand'],
        ['previous_model', 'new_model'],
        ['previous_ip', 'new_ip'],
      ].some(([from, to]) => textOrDash(row[from]) !== textOrDash(row[to]));
      const isCreate = String(row.action || '').toUpperCase() === 'CREATE';

      return (
        isCreate ||
        hasUserChange ||
        hasUbicationChange ||
        hasDepartmentChange ||
        hasAdministrativeAreaChange ||
        hasClassificationChange ||
        hasTechnologyChange
      );
    });
  }, [historyRows]);

  if (!isOpen || !item) return null;

  const assetType = String(item.asset_type?.code || item.asset_type?.name || '').toUpperCase();
  const extensionType = String(item.extension?.type || '').toUpperCase();
  const isVehicle = Boolean(item.vehicle_details) || assetType.includes('VEHICLE') || assetType.includes('VEHÍCULO') || extensionType.includes('VEHICLE');
  const isTechnology = !isVehicle && Boolean(
    item.technology || item.device_details || item.device_name ||
    extensionType === 'DEVICES' || assetType.includes('DEVICE') || assetType.includes('EQUIPO')
  );
  const isRealEstate = Boolean(item.real_estate_details) || assetType.includes('REAL_ESTATE') || assetType.includes('INMUEBLE');
  const isProperty = Boolean(item.property_details) && !isVehicle && !isRealEstate;
  const classification = item.classification?.description || item.classification?.code_new;
  const details = (entries) => entries.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
  const propertyDetails = isProperty ? details([
    ['Material', item.property_details.material], ['Dimensiones', item.property_details.dimensions],
  ]) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="asset-detail-title" onClick={(event) => event.stopPropagation()} className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">Detalle del activo</p>
            <h2 id="asset-detail-title" className="mt-1 text-2xl font-bold text-slate-900">{item.tag || 'Sin marbete'}</h2>
            <p className="mt-1 text-sm text-slate-500">{item.description || item.device_name || 'Información patrimonial y de asignación'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle icon={Info} title="Resumen" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {details([
                ['Estado', item.status_name], ['Condición', item.condition_name],
                ['Ubicación', item.ubication_name], ['Departamento', item.department_name],
                ['Área administradora', item.administrative_area_name], ['Usuario asignado', item.user],
                ['Fecha de traslado', item.transferdate ? formatDateOnlyToDDMMYYYY(item.transferdate) : null],
                ...(isTechnology ? [['Serie', item.serie]] : []),
              ]).map(([label, value]) => <Detail key={label} label={label} value={value} />)}
            </div>
          </section>
          {classification && <section className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle icon={ShieldCheck} title="Clasificación patrimonial" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Clasificación" value={classification} />
              {item.asset_type?.name && <Detail label="Tipo de activo" value={item.asset_type.name} />}
            </div>
          </section>}
          {isVehicle && item.vehicle_details && <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
            <SectionTitle icon={CarFront} title="Datos del vehículo" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{details([
              ['Marca', item.vehicle_details.make], ['Modelo', item.vehicle_details.model], ['Año', item.vehicle_details.model_year],
              ['Placa', item.vehicle_details.plate], ['Motor', item.vehicle_details.engine], ['Chasis', item.vehicle_details.chassis],
              ['Tipo', item.vehicle_details.vehicle_type], ['Combustible', item.vehicle_details.fuel_type], ['Kilometraje', item.vehicle_details.mileage],
            ]).map(([label, value]) => <Detail key={label} label={label} value={value} />)}</div>
          </section>}
          {isTechnology && <section className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle icon={Cpu} title="Datos del equipo" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{details([
              ['Equipo', item.device_name], ['Marca', item.brand_name], ['Modelo', item.model_name], ['IP', item.ip], ['Serie', item.serie],
            ]).map(([label, value]) => <Detail key={label} label={label} value={value} />)}</div>
          </section>}
          {isRealEstate && item.real_estate_details && <section className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle icon={Building2} title="Terreno o inmueble" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{details([
              ['Número catastral', item.real_estate_details.cadastral_number], ['Dirección', item.real_estate_details.address],
              ['Área (m²)', item.real_estate_details.area_m2], ['Ubicación geográfica', item.real_estate_details.location_geo],
            ]).map(([label, value]) => <Detail key={label} label={label} value={value} />)}</div>
          </section>}
          {propertyDetails.length > 0 && <section className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle icon={Building2} title="Datos del bien" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{propertyDetails.map(([label, value]) => <Detail key={label} label={label} value={value} />)}</div>
          </section>}
          {item.observation && <section className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle icon={MapPin} title="Observación" />
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.observation}</p>
          </section>}

        <details className="rounded-xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer list-none"><SectionTitle icon={RefreshCw} title={`Historial de movimientos${historyTotal ? ` (${historyTotal})` : ''}`} /></summary>
          <div className="mt-4">

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 border">Fecha</th>
                  <th className="px-2 py-2 border">Ubicación</th>
                  <th className="px-2 py-2 border">Departamento</th>
                  <th className="px-2 py-2 border">Área administradora</th>
                  <th className="px-2 py-2 border">Usuario</th>
                  <th className="px-2 py-2 border">Clasificación</th>
                  <th className="px-2 py-2 border">Tecnología</th>
                  <th className="px-2 py-2 border">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory && (
                  <tr>
                    <td className="px-2 py-3 text-center border text-gray-500" colSpan={8}>
                      Cargando historial...
                    </td>
                  </tr>
                )}

                {!loadingHistory && historyError && (
                  <tr>
                    <td className="px-2 py-3 text-center border text-red-600" colSpan={8}>
                      <div className="flex flex-col items-center gap-2">
                        <span role="alert">{historyError}</span>
                        <button
                          type="button"
                          onClick={() => setHistoryRetry((retry) => retry + 1)}
                          className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900"
                        >
                          <RefreshCw className="w-4 h-4" aria-hidden="true" />
                          Reintentar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loadingHistory && !historyError && locationHistory.length === 0 && (
                  <tr>
                    <td className="px-2 py-3 text-center border text-gray-500" colSpan={8}>
                      {historyTotal === 0
                        ? 'Sin historial de cambios para este equipo.'
                        : 'Sin cambios relevantes en esta página.'}
                    </td>
                  </tr>
                )}

                {!loadingHistory &&
                  locationHistory.map((row) => (
                    <tr key={row.id}>
                      <td className="px-2 py-2 text-center border">
                        {row.moved_at ? formatDateToDDMMYYYY(row.moved_at, '-') : '-'}
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText from={row.previous_ubication} to={row.new_ubication} />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText from={row.previous_department} to={row.new_department} />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText
                          from={row.previous_administrative_area}
                          to={row.new_administrative_area}
                        />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText from={row.previous_user} to={row.new_user} />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText
                          from={classificationText(row.previous_classification_rule)}
                          to={classificationText(row.new_classification_rule)}
                        />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <div className="flex flex-col gap-1">
                          <TransitionText from={row.previous_device} to={row.new_device} />
                          <TransitionText from={row.previous_brand} to={row.new_brand} />
                          <TransitionText from={row.previous_model} to={row.new_model} />
                          <TransitionText from={row.previous_ip} to={row.new_ip} />
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center border">{row.moved_by?.name || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loadingHistory && !historyError && historyTotalPages > 1 && (
            <Pagination
              currentPage={historyPage}
              totalPages={historyTotalPages}
              onPageChange={setHistoryPage}
            />
          )}
          </div>
        </details>
        </main>
        <footer className="flex justify-end border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
    <span className="rounded-lg bg-slate-100 p-2 text-slate-600"><Icon className="h-4 w-4" /></span>{title}
  </h3>
);

const Detail = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-medium text-slate-800">{textOrDash(value)}</p>
  </div>
);

export default InventoryDetailModal;
