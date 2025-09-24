import React, { useState, useEffect } from 'react';

function ResolveIncidentModal({ id_incident, onClose, onConfirm }) {
    const [solutionText, setSolutionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // 🚫 Bloquea scroll
        document.body.classList.add("no-scroll");

        // ✅ Quita bloqueo al desmontar modal
        return () => {
            document.body.classList.remove("no-scroll");
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!solutionText.trim()) {
            alert("Debe ingresar la solución aplicada.");
            return;
        }

        try {
            setIsSubmitting(true);
            await onConfirm(solutionText);
            onClose();
        } catch (error) {
            console.error("Error al resolver la incidencia:", error);
            alert("Error al enviar la solución.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
            <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-xl">
                <h3 className="mb-4 text-lg font-bold text-center">
                    Resolver Incidencia #{String(id_incident).padStart(6, "0")}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="solutionText" className="block mb-2 text-sm font-bold text-gray-700">
                            Solución Aplicada:
                        </label>
                        <textarea
                            id="solutionText"
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
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
                            className="px-4 py-2 font-bold text-gray-800 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
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
