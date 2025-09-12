// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Incidents, Inventory } from "@/services/api.js";
import IncidentTable from "@/components/incidents/tables/IncidentTable";
import InventoryTable from "@/components/inventory/tables/InventoryTable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [incidences, setIncidences] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingIncidences, setLoadingIncidences] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadIncidences = async () => {
    setLoadingIncidences(true);
    const data = await Incidents.fetchAll();
    setIncidences(Array.isArray(data) ? data : []);
    setLoadingIncidences(false);
  };

  const loadDevices = async () => {
    setLoadingDevices(true);
    const data = await Inventory.fetchDevices();
    setDevices(Array.isArray(data) ? data : []);
    setLoadingDevices(false);
  };

  useEffect(() => {
    loadIncidences();
    loadDevices();
  }, []);

  // Conteos por estado
  const totalIncidences = incidences.length;
  const pendientes = incidences.filter(i => i.id_status === 1).length;
  const enProceso = incidences.filter(i => i.id_status === 2).length;
  const resueltas = incidences.filter(i => i.id_status === 3).length;


  // Datos para gráfica
  const chartData = [
    { name: 'Pendiente', Cantidad: pendientes },
    { name: 'Proceso', Cantidad: enProceso },
    { name: 'Resuelta', Cantidad: resueltas },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Contenido principal */}
      <main className="w-full pt-4 pb-12">
        <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">

          {/* Encabezado */}
          <h1 className="mb-6 text-3xl font-bold text-gray-800">Dashboard</h1>

          {/* Estadísticas en Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-4 text-center bg-white rounded shadow">
              <h3 className="mb-2 text-gray-500">Total incidencias</h3>
              <p className="text-2xl font-bold text-gray-800">{totalIncidences}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 text-center bg-white rounded shadow">
              <h3 className="mb-2 text-gray-500">Pendientes</h3>
              <p className="text-2xl font-bold text-yellow-500">{pendientes}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 text-center bg-white rounded shadow">
              <h3 className="mb-2 text-gray-500">Proceso</h3>
              <p className="text-2xl font-bold text-blue-500">{enProceso}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 text-center bg-white rounded shadow">
              <h3 className="mb-2 text-gray-500">Resueltas</h3>
              <p className="text-2xl font-bold text-green-500">{resueltas}</p>
            </div>
          </div>

          {/* Gráfica de incidencias */}
          <div className="p-4 mb-6 bg-white rounded shadow">
            <h3 className="mb-2 font-semibold text-gray-700">Incidencias por estado</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Cantidad" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Botones para tablas */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              className="px-4 py-2 text-white transition bg-gray-600 rounded hover:bg-gray-500"
              onClick={() => setShowTable(!showTable)}
            >
              {showTable ? "Ocultar tabla de incidencias" : "Mostrar tabla de incidencias"}
            </button>
            <button
              className="px-4 py-2 text-white transition bg-gray-800 rounded hover:bg-gray-700"
              onClick={() => setShowInventory(!showInventory)}
            >
              {showInventory ? "Ocultar inventario" : "Mostrar inventario"}
            </button>
          </div>

          {/* Tabla de incidencias */}
          {showTable && (
            <div className="p-4 bg-white rounded shadow">
              {loadingIncidences ? (
                <p className="text-lg text-center text-gray-600">Cargando...</p>
              ) : (
                <div className="overflow-x-auto">
                  <IncidentTable incidents={incidences} />
                </div>
              )}
            </div>
          )}

          {/* InventoryTable */}
          {showInventory && (
            <div className="p-4 mb-6 bg-white rounded shadow">
              {loadingDevices ? (
                <p className="text-lg text-center text-gray-600">Cargando inventario...</p>
              ) : (
                <div className="overflow-x-auto">
                  <InventoryTable inventory={devices} />
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
