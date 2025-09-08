// src/components/incidents/ResolveIncidentModal.jsx
import React, { useState } from 'react';

function ResolveIncidentModal({ id_incident, onClose, onConfirm }) {
    const [solutionText, setSolutionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!solutionText.trim()) {
            alert("Debe ingresar la solución aplicada.");
            return;
        }

        try {
            setIsSubmitting(true);
            await onConfirm(solutionText);  // Esperar que onConfirm termine
            onClose(); // Solo cerrar si tuvo éxito
        } catch (error) {
            console.error("Error al resolver la incidencia:", error);
            alert("Error al enviar la solución.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Resolver Incidencia #{id_incident}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="solutionText" className="block text-gray-700 text-sm font-bold mb-2">
                            Solución Aplicada:
                        </label>
                        <textarea
                            id="solutionText"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            rows="4"
                            placeholder="Describa la solución aquí..."
                            value={solutionText}
                            onChange={(e) => setSolutionText(e.target.value)}
                            required
                        ></textarea>
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
                            className={`${isSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
                                } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Resolviendo...' : 'Resolver'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResolveIncidentModal;