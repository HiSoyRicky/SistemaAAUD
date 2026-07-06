import { useEffect, useState } from 'react';
import { Incidents } from '../services/incidents.api';
import IncidentTable from '../components/tables/IncidentTable';
import IncidentsSection from '../../dashboard/components/IncidentsSection.jsx';
import {
  formatDateWithWeekday,
  formatTime,
} from '../../../shared/utils/formatDate';

export default function IncidentsMonitorPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  const loadData = async () => {
    try {
      const data = await Incidents.fetchAll();
      setIncidents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Reloj
  useEffect(() => {
    const clock = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(clock);
  }, []);

  // Actualización automática
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-extrabold text-slate-800">
            Monitor de Incidencias
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            Sistema de Gestión de Incidencias
          </p>
        </div>

        <div className="text-right">
          <div className="text-5xl font-bold text-slate-800">
            {formatTime(time, '-')}
          </div>

          <div className="text-lg text-slate-500">
            {formatDateWithWeekday(time, '-')}
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>

            <span className="font-medium text-green-600">
              Actualización en tiempo real
            </span>
          </div>
        </div>
      </div>

      {/* INDICADORES */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-slate-200">
        <IncidentsSection incidences={incidents} loading={loading} />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-2xl font-bold text-slate-700">
            Listado de Incidencias
          </h2>

          <span className="text-slate-500">{incidents.length} registros</span>
        </div>

        <div className="p-5 overflow-auto max-h-[650px]">
          <IncidentTable
            incidents={incidents}
            visibleColumns={{
              email: false,
              actions: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
