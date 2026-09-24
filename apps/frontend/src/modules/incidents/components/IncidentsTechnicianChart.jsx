// IncidentsTechnicianChart.jsx

import { CheckCircle2 } from 'lucide-react';
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = [
  '#536DFE',
  '#2196D3',
  '#19B589',
  '#E5A11A',
  '#E05252',
  '#8064C8',
  '#C45B8A',
  '#3D9B96',
];

export default function IncidentsTechnicianChart({ incidents, loading }) {
  const incidencesByTechnician = incidents
    .filter((incident) => Number(incident.id_status) !== 3)
    .reduce((acc, incident) => {
      const technician = incident.technician_full_name?.trim() || 'Sin asignar';

      acc[technician] = (acc[technician] || 0) + 1;

      return acc;
    }, {});

  const technicianChartData = Object.entries(incidencesByTechnician)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

  return (
    <div className="p-6 border bg-slate-50 border-slate-200 rounded-2xl">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Incidencias pendientes por técnico</h3>

        <p className="text-sm text-slate-500">
          Incidencias que todavía no han sido resueltas, agrupadas por técnico asignado.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[360px]">
          <p className="text-sm text-slate-500">Cargando información...</p>
        </div>
      ) : technicianChartData.length === 0 ? (
        <div className="flex items-center justify-center h-[360px]">
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500" />

            <p className="font-medium text-slate-700">No hay incidencias pendientes</p>

            <p className="mt-1 text-sm text-slate-500">Todas las incidencias están resueltas.</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={technicianChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="72%"
                innerRadius="42%"
                paddingAngle={2}
              />

              <Tooltip
                formatter={(value) => [`${value} incidencia${value === 1 ? '' : 's'}`, 'Cantidad']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              />

              <Legend
                verticalAlign="bottom"
                height={50}
                wrapperStyle={{
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
