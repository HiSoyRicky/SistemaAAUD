import React from 'react';
import { formatDateToDDMMYYYY } from '@/shared/utils/formatDate';

function InventoryDetailModal({ isOpen, onClose, item }) {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                        Detalle del Equipo — {item.tag}
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
                        value={item.transferdate ? formatDateToDDMMYYYY(item.transferdate) : 'N/A'}
                    />
                </div>

                <div className="mt-4">
                    <p className="text-sm font-medium">Observación</p>
                    <p className="p-2 mt-1 text-sm bg-gray-100 rounded">
                        {item.observation || 'N/A'}
                    </p>
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
        <p className="text-gray-800">{value}</p>
    </div>
);

export default InventoryDetailModal;
