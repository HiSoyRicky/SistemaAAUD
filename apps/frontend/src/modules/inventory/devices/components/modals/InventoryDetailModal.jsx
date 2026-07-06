import React, { useEffect, useMemo, useState } from 'react';
import {
  formatDateToDDMMYYYY,
} from '../../../../../shared/utils/formatDate';
import { Inventory } from '../../services/inventory.api';

function textOrDash(value) {
  if (value === null || value === undefined) return '-';

  if (value && typeof value === 'object') {
    return (
      value.name ||
      value.label ||
      value.title ||
      value.nombre_completo ||
      value.username ||
      '-'
    );
  }

  const text = String(value).trim();
  return text === '' ? '-' : text;
}

function TransitionText({ from, to }) {
  const fromText = textOrDash(from);
  const toText = textOrDash(to);

  if (fromText === toText) {
    return <span>{toText}</span>;
  }

  return (
    <div className="flex flex-col leading-tight text-center">
      <span className="text-red-600 line-through">{fromText}</span>
      <span className="text-gray-400">→</span>
      <span className="text-emerald-700">{toText}</span>
    </div>
  );
}

function InventoryDetailModal({ isOpen, onClose, item }) {
  const [historyRows, setHistoryRows] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHistoryByDevice() {
      if (!isOpen || !item?.id) {
        setHistoryRows([]);
        return;
      }

      try {
        setLoadingHistory(true);
        const response = await Inventory.fetchMovementHistory({
          inventoryId: item.id,
          page: 1,
          limit: 100,
        });

        if (!active) return;
        setHistoryRows(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error('Error cargando historial del equipo:', error);
        if (active) setHistoryRows([]);
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    loadHistoryByDevice();

    return () => {
      active = false;
    };
  }, [isOpen, item?.id]);

  const locationHistory = useMemo(() => {
    return historyRows.filter((row) => {
      const hasUserChange =
        textOrDash(row.previous_user) !== textOrDash(row.new_user);
      const hasUbicationChange =
        textOrDash(row.previous_ubication) !== textOrDash(row.new_ubication);
      const hasDepartmentChange =
        textOrDash(row.previous_department) !== textOrDash(row.new_department);
      const isCreate = String(row.action || '').toUpperCase() === 'CREATE';

      return (
        isCreate || hasUserChange || hasUbicationChange || hasDepartmentChange
      );
    });
  }, [historyRows]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Detalle del Equipo - {item.tag}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✖
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Detail label="Ubicación" value={item.ubication_name} />
          <Detail label="Departamento" value={item.department_name} />
          <Detail label="Usuario" value={item.user || 'N/A'} />
          <Detail label="Equipo" value={item.device_name} />
          <Detail label="Marca" value={item.brand_name} />
          <Detail label="Modelo" value={item.model_name} />
          <Detail label="Serie" value={item.serie} />
          <Detail label="IP" value={item.ip || 'N/A'} />
          <Detail label="Estado" value={item.status_name} />
          <Detail
            label="Fecha de traslado"
            value={
              item.transferdate
                ? formatDateToDDMMYYYY(item.transferdate)
                : 'N/A'
            }
          />
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">Observación</p>
          <p className="p-2 mt-1 text-sm bg-gray-100 rounded">
            {item.observation || 'N/A'}
          </p>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">
            Historial del equipo (Ubicación / Departamento / Usuario)
          </h3>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 border">Fecha</th>
                  <th className="px-2 py-2 border">Ubicación</th>
                  <th className="px-2 py-2 border">Departamento</th>
                  <th className="px-2 py-2 border">Usuario</th>
                  <th className="px-2 py-2 border">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory && (
                  <tr>
                    <td
                      className="px-2 py-3 text-center border text-gray-500"
                      colSpan={5}
                    >
                      Cargando historial...
                    </td>
                  </tr>
                )}

                {!loadingHistory && locationHistory.length === 0 && (
                  <tr>
                    <td
                      className="px-2 py-3 text-center border text-gray-500"
                      colSpan={5}
                    >
                      Sin historial de cambios para este equipo.
                    </td>
                  </tr>
                )}

                {!loadingHistory &&
                  locationHistory.map((row) => (
                    <tr key={row.id}>
                      <td className="px-2 py-2 text-center border">
                        {row.moved_at
                          ? formatDateToDDMMYYYY(row.moved_at, '-')
                          : '-'}
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText
                          from={row.previous_ubication}
                          to={row.new_ubication}
                        />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText
                          from={row.previous_department}
                          to={row.new_department}
                        />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        <TransitionText
                          from={row.previous_user}
                          to={row.new_user}
                        />
                      </td>
                      <td className="px-2 py-2 text-center border">
                        {row.moved_by?.name || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div>
    <p className="font-medium text-gray-600">{label}</p>
    <p className="text-gray-800">{value || 'N/A'}</p>
  </div>
);

export default InventoryDetailModal;
