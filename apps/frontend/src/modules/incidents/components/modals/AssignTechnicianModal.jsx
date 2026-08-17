// AssignTechnicianModal.jsx

import { useState } from 'react';
import { logger } from '../../../../../../backend/src/common/logger';

function AssignTechnicianModal({ technicians, onClose, onConfirm }) {
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTechnician) {
      alert('Por favor, selecciona un técnico.');
      return;
    }

    setShowConfirm(true);
  };

  const confirmAssign = async () => {
    setIsSubmitting(true);

    try {
      const technicianId = Number(selectedTechnician);
      logger.info('Asignando técnico:', technicianId + ' a incidencia ' + onConfirm);
      await onConfirm(technicianId);
      onClose();
    } catch (error) {
      console.error('Error al asignar técnico:', error);
      alert(
        `Ocurrió un error al asignar el técnico: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  // Validación de técnicos y ordenados alfabéticamente
  const validTechnicians = Array.isArray(technicians)
    ? [...technicians].sort((a, b) =>
        a.nombre_completo.localeCompare(b.nombre_completo, 'es', {
          sensitivity: 'base',
        })
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-xl">
        <h3 className="mb-4 text-lg font-bold">Asignar Técnico</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="technicianSelect"
              className="block mb-2 text-sm font-bold text-gray-700"
            >
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
                  <option key={tech.id} value={tech.id}>
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
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50">
          <div className="w-full max-w-sm p-5 bg-white shadow-xl rounded-xl">
            <h4 className="mb-3 text-lg font-extrabold text-gray-800">Confirmar asignación</h4>

            <p className="mb-5 text-sm text-gray-700">
              ¿Estás seguro de asignar esta incidencia al técnico{' '}
              <strong>
                {validTechnicians.find((t) => t.id === Number(selectedTechnician))?.nombre_completo}
              </strong>{' '}
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-bold bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmAssign}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-bold text-white rounded flex items-center justify-center gap-2
                                        ${
                                          isSubmitting
                                            ? 'bg-blue-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
              >
                {isSubmitting && (
                  <svg
                    className="w-4 h-4 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}

                {isSubmitting ? 'Asignando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignTechnicianModal;
