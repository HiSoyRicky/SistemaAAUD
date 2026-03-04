import { useEffect, useState } from "react";
import { Inventory } from "@/features/inventory/devices/services/inventory.api.js";
import { Incidents } from "@/features/incidents/services/incidents.api.js";
import IncidentsSection from "../components/IncidentsSection.jsx";
import InventorySection from "../components/InventorySection.jsx";

export default function Dashboard() {
  const [incidences, setIncidences] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loadingIncidences, setLoadingIncidences] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const loadIncidences = async () => {
    setLoadingIncidences(true);
    try {
      const data = await Incidents.fetchAll();
      setIncidences(Array.isArray(data) ? data : []);
    } finally {
      setLoadingIncidences(false);
    }
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await Inventory.fetchDevices();
      setInventory(Array.isArray(data) ? data : []);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    void loadIncidences();
    void loadInventory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      <main className="w-full min-w-0 pt-6 pb-12">
        <div className="w-full px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
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
              {loadingIncidences || loadingInventory
                ? "Cargando datos..."
                : "Datos cargados ✅"}
            </div>
          </div>

          <IncidentsSection
            incidences={incidences}
            loading={loadingIncidences}
          />
          <InventorySection inventory={inventory} loading={loadingInventory} />
        </div>
      </main>
    </div>
  );
}
