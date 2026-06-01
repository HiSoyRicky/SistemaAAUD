import React, { useState, useMemo, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../../../shared/hooks/useAuth";
import TonerMovementModal from "../modals/TonerMovementsModal";
import Pagination from "../../../../../shared/components/ui/Pagination";
import ActionButton from "../../../../../shared/components/ui/ActionButton";

const COLOR_MAP = {
  BLACK: "NEGRO",
  CYAN: "CIAN",
  MAGENTA: "MAGENTA",
  YELLOW: "AMARILLO",
};

const translateColor = (color) => COLOR_MAP[color] || color;

function TonerTable({ toners = [], onRefresh }) {
  const { userType } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedToner, setSelectedToner] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const itemsPerPage = 12;

  // 🔹 FILTRADO
  const filtered = useMemo(() => {
    const term = search.toLowerCase();

    return toners.filter((t) => {
      return (
        t.brand?.toLowerCase().includes(term) ||
        t.printer_model?.toLowerCase().includes(term) ||
        t.toner_model?.toLowerCase().includes(term) ||
        translateColor(t.color)?.toLowerCase().includes(term)
      );
    });
  }, [toners, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginated = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filtered, currentPage]);

  const openMovementModal = (toner) => {
    setSelectedToner(toner);
    setMovementModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      await onRefresh?.();
    } catch (err) {
      console.error(err);
      setError("Error al refrescar datos");
    } finally {
      setLoading(false);
    }
  };

  const canCreateMovement = ["admin", "tecnico", "consultor"].includes(userType);

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventario de Tóners</h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/inventario/toners/history")}
            className="px-3 py-1 text-white bg-gray-700 rounded"
          >
            Ver Historial
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`flex items-center gap-1 px-3 py-1 text-white rounded ${loading ? "bg-blue-300" : "bg-blue-500"
              }`}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>
      </div>

      {/* BUSCADOR + CONTADOR */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Buscar por marca, modelo o color..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border rounded w-72"
        />

        <span className="text-sm text-gray-500">
          {filtered.length} resultados
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-hidden bg-white rounded shadow">
        <table className="w-full text-sm border border-collapse border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Marca</th>
              <th className="px-3 py-2 border">Modelo de impresora</th>
              <th className="px-3 py-2 border">Modelo</th>
              <th className="px-3 py-2 border">Color</th>
              <th className="px-3 py-2 border">Stock</th>
              <th className="px-3 py-2 border">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-gray-500">
                  No hay resultados
                </td>
              </tr>
            ) : (
              paginated.map((t) => {
                const lowStock = t.stock <= t.min_stock;

                return (
                  <tr key={t.id}>
                    <td className="px-3 py-2 border">
                      {t.brand || "—"}
                    </td>

                    <td className="px-3 py-2 border">
                      {t.printer_model || "—"}
                    </td>

                    <td className="px-3 py-2 border">
                      {t.toner_model || "—"}
                    </td>

                    <td className="px-3 py-2 border">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              t.color === "BLACK"
                                ? "#000"
                                : t.color === "CYAN"
                                  ? "#00bcd4"
                                  : t.color === "MAGENTA"
                                    ? "#e91e63"
                                    : "#fbc02d",
                          }}
                        />
                        {translateColor(t.color)}
                      </div>
                    </td>

                    <td
                      className={`px-3 py-2 border font-semibold text-center ${lowStock ? "text-red-600" : "text-green-600"
                        }`}
                    >
                      {t.stock}
                      {lowStock && (
                        <span className="ml-2 text-xs text-red-500">
                          (bajo)
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2 border">
                      <div className="flex justify-center">
                        {canCreateMovement && (
                          <ActionButton
                            onClick={() => openMovementModal(t)}
                            type="refresh"
                          >
                            Movimiento
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* MODAL */}
      {movementModalOpen && (
        <TonerMovementModal
          toner={selectedToner}
          onClose={() => setMovementModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

export default TonerTable;