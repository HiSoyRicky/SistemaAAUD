import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/apiBaseUrl.js';

function IncidentEditForm({ incident, onCancel, onSave }) {
    const [description, setDescription] = useState(incident.description || '');
    const [category, setCategory] = useState(incident.id_category || 1);
    const [solution, setSolution] = useState(incident.solution || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const API_URL = API_BASE_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`${API_URL}/api/incidents/${incident.id_incident}`, {
                description,
                id_category: category,
                solution,
                silent: true,
            });
            onSave(response.data);
        } catch (error) {
            setError(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-md" noValidate>
            <h2 className="mb-4 text-xl font-bold">
                Editar incidencia #{String(incident.id_incident).padStart(6, '0')}
            </h2>

            {/* Descripción*/}
            <div className="relative mb-6">
                <label htmlFor="description" className="block mb-2 text-sm text-gray-700">
                    Descripción *
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                    className="block w-full px-3 pt-6 pb-2 text-gray-900 border border-gray-300 rounded-md resize-none peer focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    placeholder=" "
                />
            </div>

            {/* Categoría */}
            <div className="relative mb-6">
                <label htmlFor="category" className="block mb-2 text-sm text-gray-700">
                    Categoría *
                </label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(Number(e.target.value))}
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md peer focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    required
                >
                    <option value={1}>Problemas con el internet</option>
                    <option value={2}>Problemas con el equipo</option>
                    <option value={3}>Problemas con un programa</option>
                    <option value={4}>Otro</option>
                </select>
                
                {/* Otra categoría */}
                {category === 4 && (
                    <div className="mt-4">
                        <label htmlFor="otherCategory" className="block mb-2 text-sm text-gray-700">
                            Detalle de otra categoría *
                        </label>
                        <input
                            type="text"
                            id="otherCategory"
                            value={incident.other_category_detail || ''}
                            readOnly
                            className="block w-full px-3 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                        />
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && <p className="mb-4 font-medium text-center text-red-600">{error}</p>}

            {/* Botones */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-5 py-2 text-gray-700 transition border border-gray-300 rounded-md hover:bg-gray-100"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-5 py-2 rounded-md text-white font-semibold transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}

export default IncidentEditForm;
