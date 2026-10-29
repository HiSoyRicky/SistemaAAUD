// IncidentsSection.jsx

import { BarChart3, Building2, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Clock3, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';

import IncidentsTechnicianChart from '../../incidents/components/IncidentsTechnicianChart.jsx';
import SectionHeader from './SectionHeader.jsx';
import StatCard from './StatCard.jsx';
import { incidentDepartmentSummary } from '../utils/dashboard.helpers.js';

export default function IncidentsSection({ incidences, loading }) {
  const totalIncidences = incidences.length;

  const pendientes = incidences.filter((incident) => Number(incident.id_status) === 1).length;

  const enProceso = incidences.filter((incident) => Number(incident.id_status) === 2).length;

  const resueltas = incidences.filter((incident) => Number(incident.id_status) === 3).length;
  const [year, setYear] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const summary = useMemo(() => incidentDepartmentSummary(incidences, year, department), [incidences, year, department]);

  return (
    <section className="p-8 mb-10 bg-white border shadow-sm border-slate-200 rounded-3xl">
      <SectionHeader
        title="Incidencias"
        desc="Estado actual de solicitudes y seguimiento"
        icon={ClipboardList}
      />

      {/* TARJETAS */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total"
          value={loading ? '...' : totalIncidences}
          icon={ClipboardList}
          gradient="from-indigo-500 to-indigo-700"
        />

        <StatCard
          title="Pendientes"
          value={loading ? '...' : pendientes}
          icon={Clock3}
          gradient="from-amber-400 to-amber-600"
        />

        <StatCard
          title="En proceso"
          value={loading ? '...' : enProceso}
          icon={Wrench}
          gradient="from-sky-400 to-sky-700"
        />

        <StatCard
          title="Resueltas"
          value={loading ? '...' : resueltas}
          icon={CheckCircle2}
          gradient="from-emerald-400 to-emerald-700"
        />
      </div>

      {/* GRÁFICA */}
      <div className="mt-8">
        <IncidentsTechnicianChart incidents={incidences} loading={loading} />
      </div>
      <details className="mt-6 border bg-slate-50 border-slate-200 rounded-2xl group">
        <summary className="flex items-center gap-4 p-5 cursor-pointer list-none rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">
          <span className="grid w-11 h-11 text-indigo-600 bg-indigo-100 rounded-xl place-items-center"><BarChart3 size={21} /></span>
          <span className="flex-1 min-w-0"><span className="block text-lg font-bold text-slate-800">Incidencias por departamento</span><span className="block text-sm text-slate-500">Consulta el ranking y el desglose mensual</span></span>
          <ChevronDown className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <p className="mb-4 text-sm text-slate-500">Incidencias a las que tienes acceso, incluyendo las resueltas. El año se basa en la fecha de creación (hora de Panamá).</p>
        <div className="grid gap-4 mb-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
          <label className="block text-sm font-semibold text-slate-700">Año
            <span className="relative block mt-2"><CalendarDays className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-indigo-500" aria-hidden="true" />
            <select value={year} onChange={(event) => { setYear(event.target.value); setDepartment('ALL'); }} className="w-full h-11 pl-10 pr-10 text-sm font-medium bg-white border shadow-sm appearance-none cursor-pointer rounded-xl border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="ALL">Todos los años</option>{summary.years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <ChevronDown className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none right-3 top-1/2 text-slate-400" aria-hidden="true" /></span>
          </label>
          <label className="block min-w-0 text-sm font-semibold text-slate-700">Departamento para el desglose mensual
            <span className="relative block mt-2"><Building2 className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-3 top-1/2 text-indigo-500" aria-hidden="true" />
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full h-11 pl-10 pr-10 text-sm font-medium bg-white border shadow-sm appearance-none cursor-pointer rounded-xl border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="ALL">Todos los departamentos</option>{summary.departments.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <ChevronDown className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none right-3 top-1/2 text-slate-400" aria-hidden="true" /></span>
          </label>
        </div>
        {loading ? <p className="text-sm text-slate-500">Cargando departamentos...</p> : summary.departments.length === 0 ? (
          <p className="text-sm text-slate-500">No hay incidencias registradas.</p>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="p-5 bg-white border shadow-sm border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3 mb-5"><span className="grid w-10 h-10 text-indigo-600 bg-indigo-50 rounded-xl place-items-center"><BarChart3 className="w-5 h-5" /></span><div><h4 className="font-bold text-slate-800">Departamentos con más incidencias</h4><p className="text-xs text-slate-500">Los 10 primeros del período seleccionado</p></div></div>
              <ol className="space-y-4">{summary.departments.slice(0, 10).map((item, index) => <li key={item.key}>
                <button type="button" aria-pressed={department === item.key} onClick={() => setDepartment(department === item.key ? 'ALL' : item.key)} className={`w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 ${department === item.key ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3 mb-1.5 text-sm"><span className="w-6 text-xs font-bold text-slate-400">{String(index + 1).padStart(2, '0')}</span><span className="flex-1 min-w-0 font-medium text-slate-700">{item.label}</span><span className="font-bold tabular-nums text-slate-900">{item.count}</span></div>
                  <div className="h-2 ml-9 overflow-hidden bg-indigo-50 rounded-full"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${item.count / summary.departments[0].count * 100}%` }} /></div>
                </button>
              </li>)}</ol>
            </div>
            <div className="relative p-5 bg-white border shadow-sm border-slate-200 rounded-2xl xl:min-h-64">
              <div className="flex flex-col xl:absolute xl:inset-5">
              <div className="flex items-center gap-3 mb-5"><span className="grid w-10 h-10 text-cyan-700 bg-cyan-50 rounded-xl place-items-center"><CalendarDays className="w-5 h-5" /></span><div><h4 className="font-bold text-slate-800">Desglose mensual</h4><p className="text-xs text-slate-500">{department === 'ALL' ? 'Todos los departamentos' : summary.departments.find((item) => item.key === department)?.label} · Fecha de creación</p></div></div>
              {summary.monthly.length === 0 ? <p className="text-sm text-slate-500">No hay incidencias con fecha válida para esta selección.</p> : <div className="overflow-auto max-h-96 xl:max-h-none xl:min-h-0 xl:flex-1"><table className="w-full text-sm text-left"><thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3">Mes</th><th className="pb-3 text-right">Incidencias</th></tr></thead><tbody>{summary.monthly.map(({ month, count }) => <tr key={month} className="border-t border-slate-100"><td className="py-3 font-medium capitalize text-slate-700">{new Intl.DateTimeFormat('es-PA', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00Z`))}</td><td className="py-3 text-right"><span className="inline-flex px-3 py-1 font-bold tabular-nums text-cyan-800 bg-cyan-50 rounded-full">{count}</span></td></tr>)}</tbody></table></div>}
              {summary.undated > 0 && <p className="mt-3 text-xs text-slate-500">{summary.undated} incidencia(s) sin fecha válida no aparecen en el desglose mensual.</p>}
              </div>
            </div>
          </div>
        )}
        </div>
      </details>
    </section>
  );
}
