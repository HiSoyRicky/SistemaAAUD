import { useEffect, useMemo, useState } from "react";
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
import { Boxes, Cpu, BadgeCheck, AlertTriangle } from "lucide-react";

import ChartCard from "./ChartCard.jsx";
import FancyTooltip from "./FancyTooltip.jsx";
import SectionHeader from "./SectionHeader.jsx";
import StatCard from "./StatCard.jsx";
import {
  getBrandName,
  getDeviceName,
  getStatusName,
  groupCount,
} from "../utils/dashboard.helpers.js";

const STATUS_ORDER = [
  "Buen estado",
  "Nuevo",
  "Mal estado",
  "Para descarte",
  "Descartado",
];

export default function InventorySection({ inventory, loading }) {
  const [selectedDevice, setSelectedDevice] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");

  const deviceOptions = useMemo(() => {
    return Array.from(new Set(inventory.map(getDeviceName).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [inventory]);

  const handleDeviceBarClick = (deviceName) => {
    if (!deviceName) return;
    setSelectedDevice((prev) => (prev === deviceName ? "ALL" : deviceName));
    setSelectedBrand("ALL");
  };

  const handleBrandBarClick = (brandName) => {
    if (!brandName) return;
    setSelectedBrand((prev) => (prev === brandName ? "ALL" : brandName));
  };

  const filteredByDevice = useMemo(() => {
    if (selectedDevice === "ALL") return inventory;
    return inventory.filter((item) => (getDeviceName(item) || "Sin dato") === selectedDevice);
  }, [inventory, selectedDevice]);

  const filteredInventory = useMemo(() => {
    if (selectedBrand === "ALL") return filteredByDevice;
    return filteredByDevice.filter((item) => (getBrandName(item) || "Sin dato") === selectedBrand);
  }, [filteredByDevice, selectedBrand]);

  const totalInventory = filteredInventory.length;

  const byDevice = useMemo(
    () => groupCount(filteredInventory, getDeviceName),
    [filteredInventory]
  );

  const byDeviceAll = useMemo(() => groupCount(inventory, getDeviceName), [inventory]);
  const top8Devices = byDeviceAll.slice(0, 8);

  const byBrand = useMemo(
    () => groupCount(filteredInventory, getBrandName),
    [filteredInventory]
  );

  const byBrandInDevice = useMemo(
    () => groupCount(filteredByDevice, getBrandName),
    [filteredByDevice]
  );
  const top8Brands = byBrandInDevice.slice(0, 8);

  const byStatus = useMemo(() => {
    const data = groupCount(filteredInventory, getStatusName);
    return data.sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(a.name);
      const bIndex = STATUS_ORDER.indexOf(b.name);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [filteredInventory]);

  const unclassified = filteredInventory.filter((item) => !getDeviceName(item)).length;

  useEffect(() => {
    if (selectedDevice === "ALL") return;
    const stillExists = inventory.some((item) => getDeviceName(item) === selectedDevice);
    if (!stillExists) setSelectedDevice("ALL");
  }, [inventory, selectedDevice]);

  return (
    <section className="p-6 bg-white border shadow-sm border-slate-200 rounded-3xl">
      <div className="mt-10" />

      <SectionHeader
        title="Inventario de equipos"
        desc="Clasificación por tipo, marca y estado"
        icon={Boxes}
      />

      <div className="flex flex-wrap items-center gap-3 p-4 mb-4 border bg-slate-50 rounded-2xl">
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
            onChange={(event) => setSelectedDevice(event.target.value)}
            className="px-3 py-2 text-sm bg-white border rounded-lg shadow-sm border-slate-200"
          >
            <option value="ALL">Todos</option>
            {deviceOptions.map((device) => (
              <option key={device} value={device}>
                {device}
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
              className="px-3 py-2 text-sm font-semibold bg-white border rounded-lg shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de equipos"
          value={loading ? "..." : totalInventory}
          icon={Boxes}
          gradient="from-slate-700 to-slate-900"
        />
        <StatCard
          title="Tipos únicos"
          value={loading ? "..." : byDevice.length}
          subtitle="(Device)"
          icon={Cpu}
          gradient="from-violet-500 to-violet-800"
        />
        <StatCard
          title="Marcas únicas"
          value={loading ? "..." : byBrand.length}
          icon={BadgeCheck}
          gradient="from-teal-400 to-teal-700"
        />
        <StatCard
          title="Sin clasificar"
          value={loading ? "..." : unclassified}
          icon={AlertTriangle}
          gradient="from-rose-400 to-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top tipos de equipo" right="Click en una barra para filtrar">
          {({ width, height }) => (
            <BarChart
              width={width}
              height={height}
              data={top8Devices}
              barSize={34}
              margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
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
            <BarChart
              width={width}
              height={height}
              data={top8Brands}
              barSize={34}
              margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
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
              <BarChart
                width={width}
                height={height}
                data={byStatus}
                barSize={30}
                margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
                <Tooltip content={<FancyTooltip />} />
                <Bar dataKey="Cantidad" fill="#f97316" radius={[10, 10, 0, 0]}>
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
      )}
    </section>
  );
}
