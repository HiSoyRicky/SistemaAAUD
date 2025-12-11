import React, { useState, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
import UbiDepSelector from '@/components/UbiDepSelector';
import { toast } from 'react-toastify';
import { Modal, Button } from "react-bootstrap";

function IncidentForm({ onSubmit }) {
    const { loggedUserId, logout } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [id_incident, set_id_incident] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ubications, setUbications] = useState([]);
    const [departments, setDepartments] = useState([]);

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
        const categoryId = parseInt(formData.id_category);

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

        if (formData.id_ubication === null || formData.id_ubication === undefined) {
            newErrors.id_ubication = "Seleccione una ubicación";
        }
        if (formData.id_department === null || formData.id_department === undefined) {
            newErrors.id_department = "Seleccione un departamento";
        }

        if (!formData.description || formData.description.trim().length < 10) {
            newErrors.description = "La descripción debe tener al menos 10 caracteres";
        }

        if (!formData.id_category) {
            newErrors.id_category = "Seleccione una categoría";
        }

        if (categoryId === 4 && !formData.other_category_detail.trim()) {
            newErrors.other_category_detail = "Especifique la categoría personalizada";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const CATEGORY_OPTIONS = [
        { value: "1", label: "Problemas con el internet" },
        { value: "2", label: "Problemas con el equipo" },
        { value: "3", label: "Problemas con un programa" },
        { value: "4", label: "Otro" },
    ];

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

    // Ejemplo: cargar desde API
    useEffect(() => {
        fetch('/api/ubications')
            .then(res => res.json())
            .then(data => setUbications(data));

        fetch('/api/departments')
            .then(res => res.json())
            .then(data => setDepartments(data));
    }, []);
    const selectedUbication = ubications.find(u => u.id === formData.id_ubication)?.name || 'N/A';
    const selectedDepartment = departments.find(d => d.id === formData.id_department)?.name || 'N/A';

    // Manejo del envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!validateForm()) {
            toast.error('Por favor, corrige los errores en el formulario');
            return;
        }

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

            // Cambia 'id_incident' por 'id' (ajusta si el campo exacto es diferente en tu backend)
            const incidentIdFromResponse = response?.id_incident || response?.data?.id_incident;


            if (incidentIdFromResponse) {
                set_id_incident(incidentIdFromResponse);
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
        set_id_incident(null);
        setFormData({
            reporter_name: '',
            email: '',
            id_ubication: '',
            id_department: '',
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
        <section className="px-4 py-6">
            {/* Título + contenedor centrado */}
            <div className="max-w-5xl mx-auto">

                <div className="bg-white border border-gray-100 shadow-md rounded-2xl">
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="p-6 space-y-6 md:p-8"
                    >
                        {/* Nombre + Email */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="reporter_name"
                                    className="block mb-1 text-sm font-medium text-gray-700"
                                >
                                    Nombre completo:
                                </label>
                                <input
                                    id="reporter_name"
                                    name="reporter_name"
                                    type="text"
                                    value={formData.reporter_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                                    placeholder="Ingrese su nombre"
                                />
                                {errors.reporter_name && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.reporter_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block mb-1 text-sm font-medium text-gray-700"
                                >
                                    Correo electrónico (opcional):
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                                    placeholder="ejemplo@aaud.gob.pa"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Ubicación + Departamento */}
                        <div className="space-y-2">
                            <UbiDepSelector
                                id_ubication={formData.id_ubication}
                                id_department={formData.id_department}
                                onChange={handleUbiDepChange}
                                errors={{
                                    ubication: errors.id_ubication,
                                    department: errors.id_department,
                                }}
                                mode="incident"
                            />
                        </div>

                        {/* Categoría + Otra categoría */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="id_category"
                                    className="block mb-1 text-sm font-medium text-gray-700"
                                >
                                    Categoría:
                                </label>
                                <select
                                    id="id_category"
                                    name="id_category"
                                    value={formData.id_category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                                >
                                    <option value="" disabled>
                                        Escoge una categoría
                                    </option>
                                    {CATEGORY_OPTIONS.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.id_category && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.id_category}
                                    </p>
                                )}
                            </div>

                            {formData.id_category === '4' && (
                                <div>
                                    <label
                                        htmlFor="other_category_detail"
                                        className="block mb-1 text-sm font-medium text-gray-700"
                                    >
                                        Especifique otra categoría:
                                    </label>
                                    <input
                                        type="text"
                                        id="other_category_detail"
                                        name="other_category_detail"
                                        value={formData.other_category_detail}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                                        placeholder="Ej: Problema con la impresora"
                                    />
                                    {errors.other_category_detail && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.other_category_detail}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Descripción */}
                        <div>
                            <label
                                htmlFor="description"
                                className="block mb-1 text-sm font-medium text-gray-700"
                            >
                                Descripción del problema:
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                                placeholder="Describa el problema con el mayor detalle posible"
                                rows={4}
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {errors.submit && (
                            <p className="text-xs text-red-500">{errors.submit}</p>
                        )}

                        {/* Botón */}
                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                variant={isSubmitting ? 'secondary' : 'primary'}
                            >
                                {isSubmitting ? 'Enviando...' : 'Reportar Incidencia'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {showModal && (
                <Modal
                    show={showModal}
                    onHide={() => { }}  // deshabilita cerrar con el botón de fondo
                    centered
                    backdrop="static"  // evita cerrar al hacer click fuera
                    keyboard={false}   // evita cerrar al presionar Esc
                >
                    <Modal.Header>
                        <Modal.Title className="mx-auto">Incidencia registrada</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <div className="text-center">
                            {/* Ícono de éxito */}
                            <div className="mb-3 text-4xl text-green-600">
                                ✅
                            </div>

                            {/* Mensaje principal */}
                            <h5 className="mb-2 font-bold text-center">
                                ¡Incidencia registrada con éxito!
                            </h5>

                            {/* Detalles de la incidencia */}
                            {id_incident && (
                                <p className="mb-2">
                                    <strong>Número de incidencia:</strong> <span className="text-blue-600">#{id_incident.toString().padStart(6, '0')}</span>
                                </p>
                            )}

                            <p className="mb-1">
                                <strong>Nombre:</strong> {formData.reporter_name || 'N/A'}
                            </p>
                            <p className="mb-1">
                                <strong>Ubicación:</strong> {selectedUbication}
                            </p>
                            <p className="mb-1">
                                <strong>Departamento:</strong> {selectedDepartment}
                            </p>

                            <p className="mt-3 text-gray-600 text-lm">
                                ¿Deseas reportar otra incidencia o cerrar sesión?
                            </p>
                        </div>
                    </Modal.Body>


                    <Modal.Footer>
                        <Button variant="primary" onClick={handleNewIncident}>
                            Nueva Incidencia
                        </Button>
                        <Button variant="danger" onClick={handleLogout}>
                            Cerrar Sesión
                        </Button>
                    </Modal.Footer>
                </Modal>
            )
            }
        </section >
    );
}

export default IncidentForm;