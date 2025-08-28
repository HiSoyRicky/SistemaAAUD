// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { fetchIncidences } from "../services/api";
import IncidentTable from "../components/incidents/IncidentTable";
import InventoryTable from "../components/inventory/InventoryTable";
import { fetchDevice } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [incidences, setIncidences] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingIncidences, setLoadingIncidences] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userType } = useAuth();

  const loadIncidences = async () => {
    setLoadingIncidences(true);
    const data = await fetchIncidences();
    setIncidences(Array.isArray(data) ? data : []);
    setLoadingIncidences(false);
  };

  const loadDevices = async () => {
    setLoadingDevices(true);
    const data = await fetchDevice();
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
  const resueltas = incidences.filter(i => i.id_status === 3).length;
  const enProceso = incidences.filter(i => i.id_status === 2).length;


  // Datos para gráfica
  const chartData = [
    { name: 'Pendiente', Cantidad: pendientes },
    { name: 'Resuelta', Cantidad: resueltas },
    { name: 'En Proceso', Cantidad: enProceso },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Botón hamburguesa */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay móvil */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Contenido principal */}
      <main className="flex-1 pt-4 pb-12 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

          {/* Encabezado */}
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {/* Estadísticas en Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow rounded p-4 flex flex-col items-center justify-center text-center">
              <h3 className="text-gray-500 mb-2">Total Incidencias</h3>
              <p className="text-2xl font-bold text-gray-800">{totalIncidences}</p>
            </div>
            <div className="bg-white shadow rounded p-4 flex flex-col items-center justify-center text-center">
              <h3 className="text-gray-500 mb-2">Pendientes</h3>
              <p className="text-2xl font-bold text-yellow-500">{pendientes}</p>
            </div>
            <div className="bg-white shadow rounded p-4 flex flex-col items-center justify-center text-center">
              <h3 className="text-gray-500 mb-2">En Proceso</h3>
              <p className="text-2xl font-bold text-blue-500">{enProceso}</p>
            </div>
            <div className="bg-white shadow rounded p-4 flex flex-col items-center justify-center text-center">
              <h3 className="text-gray-500 mb-2">Resueltas</h3>
              <p className="text-2xl font-bold text-green-500">{resueltas}</p>
            </div>
          </div>

          {/* Gráfica de incidencias */}
          <div className="bg-white shadow rounded p-4 mb-6">
            <h3 className="text-gray-700 font-semibold mb-2">Incidencias por estado</h3>
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
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
              onClick={() => setShowTable(!showTable)}
            >
              {showTable ? "Ocultar tabla de incidencias" : "Mostrar tabla de incidencias"}
            </button>
            <button
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
              onClick={() => setShowInventory(!showInventory)}
            >
              {showInventory ? "Ocultar inventario" : "Mostrar inventario"}
            </button>
          </div>

          {/* Tabla de incidencias */}
          {showTable && (
            <div className="bg-white shadow rounded p-4">
              {loadingIncidences ? (
                <p className="text-center text-gray-600 text-lg">Cargando...</p>
              ) : (
                <div className="overflow-x-auto">
                  <IncidentTable incidents={incidences} />
                </div>
              )}
            </div>
          )}

          {/* InventoryTable */}
          {showInventory && (
            <div className="bg-white shadow rounded p-4 mb-6">
              {loadingDevices ? (
                <p className="text-center text-gray-600 text-lg">Cargando inventario...</p>
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
