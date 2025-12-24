// SummaryCards.jsx
import React, { useMemo } from "react";

function StatCard({ title, value, color }) {
  const colors = {
    blue: "text-blue-600",
    orange: "text-orange-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    red: "text-red-600",
    gray: "text-gray-600",
  };

  return (
    <div className="p-6 text-center bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
      <p className={`text-4xl font-bold ${colors[color] ?? colors.gray}`}>
        {value}
      </p>
    </div>
  );
}

export default function SummaryCards({ incidents = [], userType, loggedUserId }) {
  // Normaliza IDs por si vienen como string
  const myId = loggedUserId != null ? Number(loggedUserId) : null;

  // Helpers
  const isStatus = (i, s) => Number(i.id_status) === s;
  const isMine = (i) => myId != null && Number(i.id_technician) === myId;

  // Métricas base
  const total = incidents.length;

  // Pendientes sin asignar (para admin suele ser status 1)
  const pendingUnassigned = incidents.filter((i) => isStatus(i, 1)).length;

  // Asignadas / por resolver (status 2)
  const assignedAll = incidents.filter((i) => isStatus(i, 2)).length;
  const assignedMine = incidents.filter((i) => isStatus(i, 2) && isMine(i)).length;

  // Resueltas (status 3)
  const resolvedAll = incidents.filter((i) => isStatus(i, 3)).length;
  const resolvedMine = incidents.filter((i) => isStatus(i, 3) && isMine(i)).length;

  // Cards por rol
  const cards = useMemo(() => {
    if (userType === "admin") {
      return [
        { title: "Total de Incidencias", value: total, color: "blue" },
        { title: "Pendientes sin asignar", value: pendingUnassigned, color: "orange" },
        { title: "Por resolver (asignadas)", value: assignedAll, color: "yellow" },
        { title: "Resueltas", value: resolvedAll, color: "green" },
      ];
    }

    if (userType === "tecnico") {
      return [
        { title: "Mis incidencias asignadas", value: assignedMine, color: "yellow" },
        { title: "Mis incidencias resueltas", value: resolvedMine, color: "green" },
      ];
    }

    // Otros roles
    return [
      { title: "Total de Incidencias", value: total, color: "blue" },
      { title: "Resueltas", value: resolvedAll, color: "green" },
    ];
  }, [
    userType,
    total,
    pendingUnassigned,
    assignedAll,
    assignedMine,
    resolvedAll,
    resolvedMine,
  ]);

  // Grid responsive según cantidad de cards
  const gridCols =
    cards.length === 2
      ? "md:grid-cols-2"
      : cards.length === 3
      ? "md:grid-cols-3"
      : "md:grid-cols-4";

  return (
    <div className={`grid grid-cols-1 gap-4 mb-8 ${gridCols}`}>
      {cards.map((c) => (
        <StatCard key={c.title} title={c.title} value={c.value} color={c.color} />
      ))}
    </div>
  );
}
