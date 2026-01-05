import { useEffect, useMemo, useRef, useState } from "react";
import { Inventory } from "@/features/inventory/services/inventory.api.js";
import { Incidents } from "@/features/incidents/services/incidents.api.js";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

import {
  ClipboardList,
  Clock3,
  Wrench,
  CheckCircle2,
  Boxes,
  Cpu,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

/** Agrupar y contar */
const groupCount = (arr, keyGetter) => {
  const map = new Map();
  for (const item of arr) {
    const key = keyGetter(item) ?? "Sin dato";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, Cantidad]) => ({ name, Cantidad }))
    .sort((a, b) => b.Cantidad - a.Cantidad);
};

function StatCard({ title, value, subtitle, icon: Icon, gradient = "from-slate-600 to-slate-800" }) {
  return (
    <div className="relative overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200/70">
      {/* Glow */}
      <div className={`absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl`} />
      <div className="relative flex items-center gap-4 p-5">
        <div className={`grid place-items-center rounded-2xl p-3 text-white bg-gradient-to-br ${gradient} shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {value}
            </span>
            {subtitle ? (
              <span className="text-sm font-medium text-slate-500">{subtitle}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="px-5 py-3 text-xs text-slate-500">
        Actualizado en tiempo real
      </div>
    </div>
  );
}

function SectionHeader({ title, desc, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="grid w-10 h-10 text-white shadow-sm rounded-2xl place-items-center bg-slate-900">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        {desc ? <p className="text-sm text-slate-500">{desc}</p> : null}
      </div>
    </div>
  );
}

function ChartCard({ title, children, right }) {
  const [containerRef, size] = useElementSize();

  const width = Math.max(0, Math.floor(size.width));
  const height = 280;

  return (
    <div className="p-5 bg-white border shadow-sm rounded-2xl border-slate-200/70">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {right ? <div className="text-xs text-slate-500">{right}</div> : null}
      </div>

      <div ref={containerRef} className="w-full h-[280px] min-w-0">
        {width > 0 ? (
          typeof children === "function"
            ? children({ width, height })
            : children
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-400">
            Cargando gráfica...
          </div>
        )}
      </div>
    </div>
  );
}




function FancyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 bg-white border shadow-md rounded-xl border-slate-200">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">
        Cantidad: <span className="font-bold">{payload[0].value}</span>
      </p>
    </div>
  );
}

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}

export default function Dashboard() {
  const [incidences, setIncidences] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loadingIncidences, setLoadingIncidences] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const loadIncidences = async () => {
    setLoadingIncidences(true);
    const data = await Incidents.fetchAll();
    setIncidences(Array.isArray(data) ? data : []);
    setLoadingIncidences(false);
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    const data = await Inventory.fetchDevices(); // GET /api/inventory
    setInventory(Array.isArray(data) ? data : []);
    setLoadingInventory(false);
  };

  useEffect(() => {
    loadIncidences();
    loadInventory();
  }, []);

  // Filtro (tipo de equipo)
  const [selectedDevice, setSelectedDevice] = useState("ALL");

  // Opciones de equipos (para el select)
  const deviceOptions = useMemo(() => {
    const names = groupCount(inventory, (i) => i.device?.name || i.device_name).map(x => x.name);
    return names; // ya viene ordenado por cantidad desc
  }, [inventory]);

  const [selectedBrand, setSelectedBrand] = useState("ALL");


  const handleDeviceBarClick = (deviceName) => {
    if (!deviceName) return;
    setSelectedDevice((prev) => (prev === deviceName ? "ALL" : deviceName));
    setSelectedBrand("ALL"); // al cambiar Device, reset Brand
  };

  const handleBrandBarClick = (brandName) => {
    if (!brandName) return;
    setSelectedBrand((prev) => (prev === brandName ? "ALL" : brandName));
  };

  // =======================
  // Incidencias
  // =======================
  const totalIncidences = incidences.length;
  const pendientes = incidences.filter((i) => Number(i.id_status) === 1).length;
  const enProceso = incidences.filter((i) => Number(i.id_status) === 2).length;
  const resueltas = incidences.filter((i) => Number(i.id_status) === 3).length;

  const chartIncidents = useMemo(
    () => [
      { name: "Pendiente", Cantidad: pendientes },
      { name: "En proceso", Cantidad: enProceso },
      { name: "Resuelta", Cantidad: resueltas },
    ],
    [pendientes, enProceso, resueltas]
  );

  // =======================
  // Inventario
  // =======================
  // 1) Dataset base (sin filtros)
  const baseInventory = inventory;

  // 2) Filtrado por Device
  const filteredByDevice = useMemo(() => {
    if (selectedDevice === "ALL") return baseInventory;

    return baseInventory.filter((i) => {
      const name = i.device?.name || i.device_name || "Sin dato";
      return name === selectedDevice;
    });
  }, [baseInventory, selectedDevice]);

  // 3) Filtrado final (Device + Brand)
  const filteredInventory = useMemo(() => {
    if (selectedBrand === "ALL") return filteredByDevice;

    return filteredByDevice.filter((i) => {
      const brand = i.brand?.name || i.brand_name || "Sin dato";
      return brand === selectedBrand;
    });
  }, [filteredByDevice, selectedBrand]);

  const totalInventory = filteredInventory.length;

  const byDevice = useMemo(
    () => groupCount(filteredInventory, (i) => i.device?.name || i.device_name),
    [filteredInventory]
  );

  const byDeviceAll = useMemo(
    () => groupCount(baseInventory, (i) => i.device?.name || i.device_name),
    [baseInventory]
  );
  const top8Devices = byDeviceAll.slice(0, 8);


  const byBrand = useMemo(
    () => groupCount(filteredInventory, (i) => i.brand?.name || i.brand_name),
    [filteredInventory]
  );

  // marcas disponibles dentro del device seleccionado (sin aplicar filtro de marca)
  const byBrandInDevice = useMemo(
    () => groupCount(filteredByDevice, (i) => i.brand?.name || i.brand_name),
    [filteredByDevice]
  );
  const top8Brands = byBrandInDevice.slice(0, 8);


  const STATUS_ORDER = [
    "Buen estado",
    "Nuevo",
    "Mal estado",
    "Para descarte",
    "Descartado",
  ];

  const byStatus = useMemo(() => {
    const data = groupCount(
      filteredInventory,
      (i) => i.status?.name || i.status_name
    );

    return data.sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(a.name);
      const bIndex = STATUS_ORDER.indexOf(b.name);

      // Si alguno no está en la lista, lo manda al final
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [filteredInventory]);

  const unclassified = filteredInventory.filter(
    (x) => !(x.device?.name || x.device_name)
  ).length;

  // Colores por categoría (más vivo)
  const incidentBarColors = ["#f59e0b", "#3b82f6", "#22c55e"];

  useEffect(() => {
    if (selectedDevice === "ALL") return;
    const stillExists = inventory.some((i) => (i.device?.name || i.device_name) === selectedDevice);
    if (!stillExists) setSelectedDevice("ALL");
  }, [inventory, selectedDevice]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      <main className="w-full min-w-0 pt-6 pb-12">
        <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Resumen general de incidencias e inventario
              </p>
            </div>

            <div className="text-xs text-slate-500">
              {loadingIncidences || loadingInventory ? "Cargando datos..." : "Datos cargados ✅"}
            </div>
          </div>

          {/* =======================
              INCIDENCIAS
          ======================= */}
          <SectionHeader
            title="Incidencias"
            desc="Estado actual de solicitudes y seguimiento"
            icon={ClipboardList}
          />

          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total"
              value={loadingIncidences ? "..." : totalIncidences}
              icon={ClipboardList}
              gradient="from-indigo-500 to-indigo-700"
            />
            <StatCard
              title="Pendientes"
              value={loadingIncidences ? "..." : pendientes}
              icon={Clock3}
              gradient="from-amber-400 to-amber-600"
            />
            <StatCard
              title="En proceso"
              value={loadingIncidences ? "..." : enProceso}
              icon={Wrench}
              gradient="from-sky-400 to-sky-700"
            />
            <StatCard
              title="Resueltas"
              value={loadingIncidences ? "..." : resueltas}
              icon={CheckCircle2}
              gradient="from-emerald-400 to-emerald-700"
            />
          </div>

          {/* =======================
              INVENTARIO
          ======================= */}
          <div className="mt-10" />
          <SectionHeader
            title="Inventario"
            desc="Clasificación por tipo, marca y estado"
            icon={Boxes}
          />

          <div className="flex flex-col gap-2 mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Filtro actual:{" "}
              <span className="font-semibold text-slate-900">
                {selectedDevice === "ALL" ? "Todos los equipos" : selectedDevice}
              </span>
              {selectedDevice !== "ALL" && (
                <>
                  {" "}
                  • Marca:{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedBrand === "ALL" ? "Todas" : selectedBrand}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="px-3 py-2 text-sm bg-white border rounded-xl border-slate-200 text-slate-700"
              >
                <option value="ALL">Todos</option>
                {deviceOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {selectedDevice !== "ALL" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDevice("ALL");
                    setSelectedBrand("ALL");
                  }}
                  className="px-3 py-2 text-sm font-semibold border rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>


          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total de equipos"
              value={loadingInventory ? "..." : totalInventory}
              icon={Boxes}
              gradient="from-slate-700 to-slate-900"
            />
            <StatCard
              title="Tipos únicos"
              value={loadingInventory ? "..." : byDevice.length}
              subtitle="(Device)"
              icon={Cpu}
              gradient="from-violet-500 to-violet-800"
            />
            <StatCard
              title="Marcas únicas"
              value={loadingInventory ? "..." : byBrand.length}
              icon={BadgeCheck}
              gradient="from-teal-400 to-teal-700"
            />
            <StatCard
              title="Sin clasificar"
              value={loadingInventory ? "..." : unclassified}
              icon={AlertTriangle}
              gradient="from-rose-400 to-rose-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            <ChartCard title="Top tipos de equipo" right="Click en una barra para filtrar">

              {({ width, height }) => (
                <BarChart width={width} height={height} data={top8Devices} barSize={34} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<FancyTooltip />} />
                  <Bar
                    dataKey="Cantidad"
                    radius={[10, 10, 0, 0]}
                    activeBar={null}
                    onClick={(data) => {
                      const name = data?.name;
                      handleDeviceBarClick(name);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {top8Devices.map((entry, idx) => {
                      const isSelected = entry.name === selectedDevice;
                      const isFiltering = selectedDevice !== "ALL";

                      return (
                        <Cell
                          key={`cell-device-${idx}`}
                          fill={isSelected ? "#6d28d9" : "#8b5cf6"}
                          opacity={isFiltering && !isSelected ? 0.4 : 1}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="Cantidad"
                      position="top"
                      style={{ fontSize: 11, fontWeight: 700 }}
                    />
                  </Bar>

                </BarChart>
              )}
            </ChartCard>

            <ChartCard title="Top marcas" right="Top 8">
              {({ width, height }) => (

                <BarChart width={width} height={height} data={top8Brands} barSize={34} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<FancyTooltip />} />
                  <Bar
                    dataKey="Cantidad"
                    radius={[10, 10, 0, 0]}
                    activeBar={false}
                    onClick={(data) => {
                      const name = data?.name;
                      handleBrandBarClick(name);
                    }}
                    style={{
                      cursor: selectedDevice === "ALL" ? "not-allowed" : "pointer",
                    }}
                  >
                    {top8Brands.map((entry, idx) => {
                      const isSelected = entry.name === selectedBrand;
                      const isFiltering = selectedBrand !== "ALL";

                      return (
                        <Cell
                          key={`cell-brand-${idx}`}
                          fill={isSelected ? "#065f46" : "#14b8a6"}
                          opacity={isFiltering && !isSelected ? 0.4 : 1}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="Cantidad"
                      position="top"
                      style={{ fontSize: 11, fontWeight: 700 }}
                    />

                  </Bar>
                </BarChart>
              )}
            </ChartCard>

          </div>

          {byStatus.length > 0 && (
            <div className="mt-6">
              <ChartCard title="Inventario por estado" right="Todos los estados">
                {({ width, height }) => (
                  <BarChart width={width} height={height} data={byStatus} barSize={30} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<FancyTooltip />} />
                    <Bar dataKey="Cantidad" fill="#f97316" radius={[10, 10, 0, 0]}>
                      <LabelList dataKey="Cantidad" position="top" style={{ fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                )}
              </ChartCard>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
