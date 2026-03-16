// src/components/incidents/IncidentEditModal.jsx
import React from "react";
import IncidentEditForm from "../forms/IncidentEditForm";

function IncidentEditModal({ incident, onClose, onSave }) {
    if (!incident) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h2 className="text-lg font-bold text-gray-900">
                    Editar incidencia #{String(incident.id_incident).padStart(6, "0")}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-4">
                <IncidentEditForm
                    incident={incident}
                    onCancel={onClose}
                    onSave={onSave}
                />
                </div>
            </div>
        </div>
    );
}

export default IncidentEditModal;
