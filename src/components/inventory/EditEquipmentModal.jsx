// src/components/inventory/EditEquipmentModal.jsx
import React, { useState, useEffect } from 'react';
import UbiDepSelector from '../UbiDepSelector';
import { formatDateToDDMMYYYY } from '../../utils/formatDate';
import { X } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
import { fetchDevices, fetchBrands, fetchModels, fetchStatuses } from '../../services/api';

function EditEquipmentModal({ device = {}, onClose, onConfirm }) {
    const [formData, setFormData] = useState({
        tag: device.tag || '',
        id_ubication: device.id_ubication || null,
        id_department: device.id_department || null,
        user: device.user || '',
        id_device: device.id_device || null,
        id_brand: device.id_brand || null,
        id_model: device.id_model || null,
        serie: device.serie || '',
        ip: device.ip || '',
        id_status: device.id_status || null,
        transferDate: device.transferDate ? formatDateToDDMMYYYY(device.transferDate) : '', // Para mostrar
        transferDateInput: device.transferDate
            ? new Date(device.transferDate).toISOString().split('T')[0] // Para el input
            : '',
        observation: device.observation || ''
    });

    const [errors, setErrors] = useState({});
    const [devices, setDevices] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [statuses, setStatuses] = useState([]);

    // Cargar opciones para los selectores
    useEffect(() => {
        async function fetchOptions() {
            try {
                const [devicesRes, brandsRes, modelsRes, statusesRes] = await Promise.all([
                    fetchDevices(),
                    fetchBrands(),
                    fetchModels(),
                    fetchStatuses()
                ]);
                setDevices(devicesRes);
                setBrands(brandsRes);
                setModels(modelsRes);
                setStatuses(statusesRes);
            } catch (error) {
                console.error('Error al cargar opciones:', error);
            }
        }
        fetchOptions();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'transferDateInput') {
            // Convertir la fecha del input a UTC
            setFormData((prev) => ({
                ...prev,
                transferDateInput: value,
                transferDate: value ? formatDateToDDMMYYYY(value) : ''
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
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

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.tag.trim()) newErrors.tag = 'El marbete es obligatorio';
        if (!formData.id_ubication) newErrors.id_ubication = 'Seleccione una ubicación';
        if (!formData.id_department) newErrors.id_department = 'Seleccione un departamento';
        if (!formData.serie.trim()) newErrors.serie = 'La serie es obligatoria';
        if (formData.ip && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(formData.ip)) {
            newErrors.ip = 'La IP no es válida';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onConfirm({
                ...formData,
                transferDate: formData.transferDateInput || null // sin convertir a UTC
            });
        }
    };

    // 🔹 Filtrar modelos según la marca seleccionada
    const filteredModels = models.filter(
        (model) => String(model.id_brand) === String(formData.id_brand)
    );


    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
                {/* Botón de cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    aria-label="Cerrar modal"
                >
                    <X size={20} />
                </button>

                <h3 className="text-2xl font-bold mb-6 text-center">
                    Editar Equipo #{device?.tag ?? 'N/A'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Marbete */}
                        <div>
                            <label htmlFor="tag" className="block text-sm font-bold text-gray-700 mb-1">
                                Marbete *
                            </label>
                            <input
                                id="tag"
                                name="tag"
                                type="text"
                                value={formData.tag}
                                onChange={handleChange}
                                className={`w-full border rounded px-3 py-2 ${errors.tag ? 'border-red-500' : 'border-gray-300'}`}
                                aria-invalid={!!errors.tag}
                                aria-describedby={errors.tag ? 'tag-error' : undefined}
                            />
                            {errors.tag && (
                                <p id="tag-error" className="text-red-500 text-sm mt-1">{errors.tag}</p>
                            )}
                        </div>

                        {/* UbiDepSelector */}
                        <div className="col-span-2">
                            <UbiDepSelector
                                id_ubication={formData.id_ubication}
                                id_department={formData.id_department}
                                onChange={handleUbiDepChange}
                                errors={{ ubication: errors.id_ubication, department: errors.id_department }}
                                mode="inventory"
                            />
                        </div>

                        {/* Usuario */}
                        <div>
                            <label htmlFor="user" className="block text-sm font-bold text-gray-700 mb-1">
                                Usuario
                            </label>
                            <input
                                id="user"
                                name="user"
                                type="text"
                                value={formData.user}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            />
                        </div>

                        {/* Equipo */}
                        <div>
                            <label htmlFor="id_device" className="block text-sm font-bold text-gray-700 mb-1">
                                Equipo
                            </label>
                            {devices.length > 0 ? (
                                <select
                                    id="id_device"
                                    name="id_device"
                                    value={formData.id_device || ''}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2 border-gray-300"
                                >
                                    <option value="" disabled>Selecciona un equipo</option>
                                    {devices.map((dev) => (
                                        <option key={dev.id} value={dev.id}>{dev.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-gray-500 text-sm">Cargando equipos...</p>
                            )}
                        </div>

                        {/* Marca */}
                        <div>
                            <label htmlFor="id_brand" className="block text-sm font-bold text-gray-700 mb-1">
                                Marca
                            </label>
                            <select
                                id="id_brand"
                                name="id_brand"
                                value={formData.id_brand || ''}
                                onChange={(e) => {
                                    handleChange(e);
                                    // resetear modelo cuando cambie brand
                                    setFormData((prev) => ({ ...prev, id_model: null }));
                                }}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            >
                                <option value="">Selecciona una marca</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Modelo */}
                        <div>
                            <label htmlFor="id_model" className="block text-sm font-bold text-gray-700 mb-1">
                                Modelo
                            </label>
                            <select
                                id="id_model"
                                name="id_model"
                                value={formData.id_model || ""}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                                disabled={!formData.id_brand} // 🔹 Solo habilitado si hay marca
                            >
                                <option value="">Selecciona un modelo</option>
                                {filteredModels.map((model) => (
                                    <option
                                        key={model.id}
                                        value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Serie */}
                        <div>
                            <label htmlFor="serie" className="block text-sm font-bold text-gray-700 mb-1">
                                Serie *
                            </label>
                            <input
                                id="serie"
                                name="serie"
                                type="text"
                                value={formData.serie}
                                onChange={handleChange}
                                className={`w-full border rounded px-3 py-2 ${errors.serie ? 'border-red-500' : 'border-gray-300'}`}
                                aria-invalid={!!errors.serie}
                                aria-describedby={errors.serie ? 'serie-error' : undefined}
                            />
                            {errors.serie && (
                                <p id="serie-error" className="text-red-500 text-sm mt-1">{errors.serie}</p>
                            )}
                        </div>

                        {/* IP */}
                        <div>
                            <label htmlFor="ip" className="block text-sm font-bold text-gray-700 mb-1">
                                IP
                            </label>
                            <input
                                id="ip"
                                name="ip"
                                type="text"
                                value={formData.ip}
                                onChange={handleChange}
                                className={`w-full border rounded px-3 py-2 ${errors.ip ? 'border-red-500' : 'border-gray-300'}`}
                                aria-invalid={!!errors.ip}
                                aria-describedby={errors.ip ? 'ip-error' : undefined}
                            />
                            {errors.ip && (
                                <p id="ip-error" className="text-red-500 text-sm mt-1">{errors.ip}</p>
                            )}
                        </div>

                        {/* Estado */}
                        <div>
                            <label htmlFor="id_status" className="block text-sm font-bold text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                id="id_status"
                                name="id_status"
                                value={formData.id_status || ''}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            >
                                <option value="" disabled>
                                    Selecciona un estado
                                </option>
                                {statuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha de Traslado */}
                        <div>
                            <label htmlFor="transferDateInput" className="block text-sm font-bold text-gray-700 mb-1">
                                Fecha de Traslado: {formData.transferDate || 'N/A'}
                            </label>
                            <input
                                id="transferDateInput"
                                name="transferDateInput"
                                type="date"
                                value={formData.transferDateInput}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2 border-gray-300"
                            />
                        </div>
                    </div>

                    {/* Observación */}
                    <div>
                        <label htmlFor="observation" className="block text-sm font-bold text-gray-700 mb-1">
                            Observación / Ubicación anterior
                        </label>
                        <textarea
                            id="observation"
                            name="observation"
                            value={formData.observation}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2 border-gray-300 resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditEquipmentModal;