import { ClipboardList, Clock3, Wrench, CheckCircle2 } from "lucide-react";
import StatCard from "./StatCard.jsx";
import SectionHeader from "./SectionHeader.jsx";

export default function IncidentsSection({ incidences, loading }) {
  const totalIncidences = incidences.length;
  const pendientes = incidences.filter((incident) => Number(incident.id_status) === 1).length;
  const enProceso = incidences.filter((incident) => Number(incident.id_status) === 2).length;
  const resueltas = incidences.filter((incident) => Number(incident.id_status) === 3).length;

  return (
    <section className="p-6 mb-10 bg-white border shadow-sm border-slate-200 rounded-3xl">
      <SectionHeader
        title="Incidencias"
        desc="Estado actual de solicitudes y seguimiento"
        icon={ClipboardList}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total"
          value={loading ? "..." : totalIncidences}
          icon={ClipboardList}
          gradient="from-indigo-500 to-indigo-700"
        />
        <StatCard
          title="Pendientes"
          value={loading ? "..." : pendientes}
          icon={Clock3}
          gradient="from-amber-400 to-amber-600"
        />
        <StatCard
          title="En proceso"
          value={loading ? "..." : enProceso}
          icon={Wrench}
          gradient="from-sky-400 to-sky-700"
        />
        <StatCard
          title="Resueltas"
          value={loading ? "..." : resueltas}
          icon={CheckCircle2}
          gradient="from-emerald-400 to-emerald-700"
        />
      </div>
    </section>
  );
}
