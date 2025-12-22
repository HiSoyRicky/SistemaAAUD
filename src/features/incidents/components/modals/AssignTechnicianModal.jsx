// src/components/incidents/AssignTechnicianModal.jsx
import React, { useState } from 'react';

function AssignTechnicianModal({ id_incident, technicians, onClose, onConfirm }) {
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedTechnician) {
            alert('Por favor, selecciona un técnico.');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Asignando técnico:', selectedTechnician, 'a la incidencia:', id_incident);
            await onConfirm(selectedTechnician);
            onClose();
        } catch (error) {
            console.error('Error al asignar técnico:', error);
            alert(`Ocurrió un error al asignar el técnico: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Validar technicians
    const validTechnicians = Array.isArray(technicians) ? technicians : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
            <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-xl">
                <h3 className="mb-4 text-lg font-bold">Asignar Técnico a Incidencia #{id_incident || 'N/A'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="technicianSelect" className="block mb-2 text-sm font-bold text-gray-700">
                            Selecciona un Técnico:
                        </label>
                        <select
                            id="technicianSelect"
                            name="technicianSelect"
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow focus:outline-none focus:shadow-outline"
                            value={selectedTechnician}
                            onChange={(e) => setSelectedTechnician(e.target.value)}
                            required
                        >
                            <option value="">-- Seleccione --</option>
                            {validTechnicians.length > 0 ? (
                                validTechnicians.map((tech) => (
                                    <option key={tech.id} value={tech.username}>
                                        {tech.nombre_completo}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>
                                    No hay técnicos disponibles
                                </option>
                            )}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 font-bold text-gray-800 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`${isSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Asignando...' : 'Asignar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AssignTechnicianModal;