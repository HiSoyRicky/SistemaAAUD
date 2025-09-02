// src/components/incidents/IncidentEditForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

function IncidentEditForm({ incident, onCancel, onSave }) {
    const [description, setDescription] = useState(incident.description || '');
    const [category, setCategory] = useState(incident.id_category || 1);
    const [solution, setSolution] = useState(incident.solution || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`/api/incidents/${incident.id}`, {
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
        <form
            onSubmit={handleSubmit}
            className="p-4 bg-white rounded shadow-md"
            noValidate
        >

            <h2 className="text-xl font-bold mb-4">
                Editar incidencia #{String(incident.id).padStart(6, '0')}
            </h2>

            {/* Descripción */}
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
                    className="peer block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none px-3 pt-6 pb-2 text-gray-900"
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
                    className="peer block w-full rounded-md border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 px-3 py-2 text-gray-900"
                    required
                >
                    <option value={1}>Problemas con el internet</option>
                    <option value={2}>Problemas con el equipo</option>
                    <option value={3}>Problemas con un programa</option>
                    <option value={4}>Otro</option>
                </select>
            </div>

            {/* Error message */}
            {error && (
                <p className="mb-4 text-red-600 font-medium text-center">{error}</p>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-5 py-2 rounded-md text-white font-semibold transition 
            ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}

export default IncidentEditForm;
