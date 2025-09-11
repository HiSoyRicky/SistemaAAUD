// src/components/incidents/IncidentForm.jsx
import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import UbiDepSelector from '../UbiDepSelector';
import { toast } from 'react-toastify';

function IncidentForm({ onSubmit }) {
    const { loggedUserId, loggedUserName, logout } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [id_incident, setIncidentId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado para manejar la selección de ubicación y departamento
    const [formData, setFormData] = useState({
        reporter_name: '',
        email: '',
        id_ubication: null,
        id_department: null,
        id_device: '',
        description: '',
        id_category: '',
        other_category_detail: '',
    });

    // Validación del formulario
    const validateForm = () => {
        const newErrors = {};

        if (!formData.reporter_name.trim()) {
            newErrors.reporter_name = "El nombre es obligatorio";
        } else if (formData.reporter_name.trim().length < 4) {
            newErrors.reporter_name = "El nombre debe tener al menos 4 caracteres";
        } else if (formData.reporter_name.trim().length > 30) {
            newErrors.reporter_name = "El nombre no puede superar los 30 caracteres";
        }

        if (formData.email && !/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
            newErrors.email = "El formato del correo electrónico es inválido";
        }
        if (!formData.id_ubication) {
            newErrors.id_ubication = "Seleccione una ubicación";
        }
        if (!formData.id_department) {
            newErrors.id_department = "Seleccione un departamento";
        }
        if (formData.description.length < 10) {
            newErrors.description = "La descripción debe tener al menos 10 caracteres";
        }
        if (!formData.id_category) {
            newErrors.id_category = "Seleccione una categoría";
        }
        if (!formData.id_category === "4" && !formData.other_category_detail.trim()) {
            newErrors.other_category_detail = "Especifique la categoría personalizada";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleUbiDepChange = ({ id_ubication, id_department }) => {
        setFormData((prev) => ({
            ...prev,
            id_ubication: id_ubication ? parseInt(id_ubication) : null,
            id_department: id_department ? parseInt(id_department) : null,
        }));
        setErrors((prev) => ({ ...prev, id_ubication: '', id_department: '' }));
    };

    // Manejo del envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!validateForm()) return;

        setIsSubmitting(true);

        const incidentData = {
            id_user: parseInt(loggedUserId) || 2,
            reporter_name: formData.reporter_name,
            email: formData.email || null,
            id_ubication: formData.id_ubication,
            id_department: formData.id_department,
            id_device: formData.id_device ? parseInt(formData.id_device) : null,
            description: formData.description,
            id_category: parseInt(formData.id_category),
            other_category_detail: formData.id_category === '4' ? formData.other_category_detail : null,
            status: 1,
            solution: '',
            solution_date: null,
            createdAt: new Date().toISOString(),
        };

        try {
            console.log('Enviando datos al servidor:', incidentData);
            const response = await onSubmit(incidentData);
            console.log('Respuesta del servidor:', response);
            const incidentIdFromResponse = response?.id_incident || response?.data?.id_incident;
            if (incidentIdFromResponse) {
                setIncidentId(incidentIdFromResponse);
                setShowModal(true);
            } else {
                console.error('No se recibió un ID válido en la respuesta:', response);
                setErrors({ submit: 'No se pudo obtener el ID de la incidencia. Inténtalo de nuevo.' });
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error al enviar incidencia:', error);
            setErrors({ submit: `Error al enviar la incidencia: ${error.message}` });
            setShowModal(true);
            toast.error('Error al enviar la incidencia');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset del formulario
    const handleNewIncident = () => {
        setShowModal(false);
        setIncidentId(null);
        setFormData({
            reporter_name: '',
            email: '',
            id_ubication: null,
            id_department: null,
            id_device: '',
            description: '',
            id_category: '',
            other_category_detail: '',
        });
        setErrors({});
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-lg font-bold mb-4">Reportar Nueva Incidencia</h3>
            <form onSubmit={handleSubmit} noValidate className="bg-white p-6 rounded-lg shadow-md mb-8">

                {/* Nombre */}
                <div className="mb-4">
                    <label htmlFor="reporter_name" className="block text-gray-700 text-sm font-bold mb-2">
                        Nombre completo:
                    </label>
                    <input
                        id="reporter_name"
                        name="reporter_name"
                        type="text"
                        value={formData.reporter_name}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Ingrese su nombre"
                    />
                    {errors.reporter_name && <p className="text-red-500 text-sm mt-1">{errors.reporter_name}</p>}
                </div>

                {/* Correo electrónico */}
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                        Correo electrónico (opcional):
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="ejemplo@aaud.gob.pa"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* UbiDepSelector */}
                <div className="mb-4">
                    {/* UbiDepSelector */}
                    <UbiDepSelector
                        id_ubication={formData.id_ubication}
                        id_department={formData.id_department}
                        onChange={handleUbiDepChange}
                        errors={{ ubication: errors.id_ubication, department: errors.id_department, }}
                        mode="incident"
                    />
                </div>

                {/* Categoría */}
                <div className="mb-4">
                    <label htmlFor="id_category" className="block text-gray-700 text-sm font-bold mb-2">Categoría:</label>
                    <select
                        id="id_category"
                        name="id_category"
                        value={formData.id_category}
                        onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="" disabled>Escoge una categoría</option>
                        <option value="1">Problemas con el internet</option>
                        <option value="2">Problemas con el equipo</option>
                        <option value="3">Problemas con un programa</option>
                        <option value="4">Otro</option>
                    </select>
                    {errors.id_category && <p className="text-red-500 text-sm mt-1">{errors.id_category}</p>}
                </div>

                {formData.id_category === "4" && (
                    <div className="mb-4">
                        <label htmlFor="other_category_detail" className="block text-gray-700 text-sm font-bold mb-2">Especifique otra categoría:</label>
                        <input
                            type="text"
                            id="other_category_detail"
                            value={formData.other_category_detail}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Ej: Problema con la impresora"
                        />
                        {errors.other_category_detail && <p className="text-red-500 text-sm mt-1">{errors.other_category_detail}</p>}
                    </div>
                )}

                {errors.submit && <p className="text-red-500 text-sm mb-4">{errors.submit}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
                >
                    {isSubmitting ? 'Enviando...' : 'Reportar Incidencia'}
                </button>
            </form>

            {showModal && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md text-center shadow-lg">
                        <h2 className="text-xl font-bold mb-2">
                            {errors.submit ? 'Error al reportar incidencia' : '¡Incidencia reportada!'}
                        </h2>
                        {errors.submit ? (
                            <p className="text-red-500 mb-6">{errors.submit}</p>
                        ) : (
                            <p className="mb-6">
                                <span className="font-medium">Su número de incidencia es:</span>
                                {id_incident ? `#${id_incident.toString().padStart(6, '0')}` : 'No disponible'}
                            </p>
                        )}
                        <p className="mb-0">¿Deseas reportar otra incidencia o cerrar sesión?</p>
                        <button
                            onClick={handleNewIncident}
                            className="mr-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Nueva Incidencia
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IncidentForm;