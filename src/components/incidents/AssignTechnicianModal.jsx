// src/components/incidents/AssignTechnicianModal.jsx
import React, { useState } from 'react';

function AssignTechnicianModal({ incidentId, technicians, onClose, onConfirm }) {
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
            console.log('Asignando técnico:', selectedTechnician, 'a la incidencia:', incidentId);
            await onConfirm(selectedTechnician);
            onClose();
        } catch (error) {
            console.error('Error al asignar técnico:', error);
            alert(`Ocurrió un error al asignar el técnico: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    console.log('Renderizando AssignTechnicianModal con props:', { incidentId, technicians });

    // Validar technicians
    const validTechnicians = Array.isArray(technicians) ? technicians : [];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Asignar Técnico a Incidencia #{incidentId || 'N/A'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="technicianSelect" className="block text-gray-700 text-sm font-bold mb-2">
                            Selecciona un Técnico:
                        </label>
                        <select
                            id="technicianSelect"
                            name="technicianSelect"
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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