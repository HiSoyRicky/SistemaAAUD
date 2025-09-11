// src/components/inventory/InventoryFormModal.jsx
import React, { useState, useEffect } from 'react';
import UbiDepSelector from '../UbiDepSelector';
import { formatDateToDDMMYYYY } from '../../utils/formatDate';
import { Inventory } from '../../services/api';

export default function InventoryFormModal({ initialData = {}, onCancel, onSubmit }) {
    const isEdit = !!initialData.id;

    const [formData, setFormData] = useState({
        tag: initialData.tag || '',
        id_ubication: initialData.id_ubication || null,
        id_department: initialData.id_department || null,
        user: initialData.user || '',
        id_device: initialData.id_device || null,
        id_brand: initialData.id_brand || null,
        id_model: initialData.id_model || null,
        serie: initialData.serie || '',
        ip: initialData.ip || '',
        id_status: initialData.id_status || null,
        transferdate: initialData.transferdate ? formatDateToDDMMYYYY(initialData.transferdate) : '',
        transferDateInput: initialData.transferdate
            ? new Date(initialData.transferdate).toISOString().split('T')[0]
            : '',
        observation: initialData.observation || ''
    });

    const [errors, setErrors] = useState({});
    const [options, setOptions] = useState({ devices: [], brands: [], models: [], statuses: [] });

    // 🔹 Cargar opciones para los selectores
    useEffect(() => {
        async function fetchOptions() {
            const [devices, brands, models, statuses] = await Promise.all([
                Inventory.fetchDevices(),
                Inventory.fetchBrands(),
                Inventory.fetchModels(),
                Inventory.fetchStatuses()
            ]);
            setOptions({ devices, brands, models, statuses });
        }
        fetchOptions();
    }, []);

    // 🔹 Filtrar modelos según la marca seleccionada
    const filteredModels = options.models.filter((m) => String(m.id_brand) === String(formData.id_brand));

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'transferDateInput') {
            const date = value ? new Date(value + 'T00:00:00Z') : null;
            setFormData((prev) => ({
                ...prev,
                [name]: value === '' ? null : parseInt(value),
                transferDateInput: value,
                transferdate: date ? formatDateToDDMMYYYY(date) : ''
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
            id_department: id_department ? parseInt(id_department) : null
        }));
        setErrors((prev) => ({ ...prev, id_ubication: '', id_department: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.tag.trim()) newErrors.tag = 'El marbete es obligatorio';
        if (!formData.id_ubication) newErrors.id_ubication = 'Seleccione una ubicación';
        if (!formData.id_department) newErrors.id_department = 'Seleccione un departamento';
        if (!formData.id_device) newErrors.id_device = 'Seleccione un equipo';
        if (!formData.id_brand) newErrors.id_brand = 'Seleccione una marca';
        if (!formData.id_model) newErrors.id_model = 'Seleccione un modelo';
        if (!formData.id_status) newErrors.id_status = 'Seleccione un estado';
        if (!formData.serie.trim()) newErrors.serie = 'La serie es obligatoria';
        if (formData.ip && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(formData.ip)) newErrors.ip = 'La IP no es válida';

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const transferdate = formData.transferDateInput
                ? new Date(formData.transferDateInput + 'T00:00:00Z').toISOString()
                : null;

            onSubmit({ ...formData, transferdate });
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
                <h3 className="text-2xl font-bold mb-6 text-center">
                    {isEdit ? `Editar Equipo #${formData.tag}` : 'Agregar Equipo'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Marbete */}
                    <InputField label="Marbete *" name="tag" value={formData.tag} onChange={handleChange} error={errors.tag} />

                    {/* Ubicación y Departamento */}
                    <UbiDepSelector
                        id_ubication={formData.id_ubication}
                        id_department={formData.id_department}
                        onChange={handleUbiDepChange}
                        errors={{ ubication: errors.id_ubication, department: errors.id_department }}
                        mode="inventory"
                    />

                    {/* Usuario */}
                    <InputField label="Usuario asignado" name="user" value={formData.user} onChange={handleChange} />

                    {/* Equipo */}
                    <SelectField
                        label="Nombre del equipo *"
                        name="id_device"
                        value={formData.id_device}
                        onChange={handleChange}
                        options={options.devices.map((d) => ({ id: d.id, name: d.name }))}
                        error={errors.id_device}
                    />

                    {/* Marca */}
                    <SelectField
                        label="Marca *"
                        name="id_brand"
                        value={formData.id_brand}
                        onChange={(e) => {
                            handleChange(e);
                            setFormData((prev) => ({ ...prev, id_model: '' }));
                        }}
                        options={options.brands.map((b) => ({ id: b.id, name: b.name }))}
                        error={errors.id_brand}
                    />

                    {/* Modelo */}
                    <SelectField
                        label="Modelo *"
                        name="id_model"
                        value={formData.id_model}
                        onChange={handleChange}
                        options={filteredModels.map((m) => ({ id: m.id, name: m.name }))}
                        error={errors.id_model}
                        disabled={!formData.id_brand}
                    />

                    {/* Serie */}
                    <InputField label="Serie *" name="serie" value={formData.serie} onChange={handleChange} error={errors.serie} />

                    {/* Estado */}
                    <SelectField
                        label="Estado *"
                        name="id_status"
                        value={formData.id_status}
                        onChange={handleChange}
                        options={options.statuses.map((s) => ({ id: s.id, name: s.name }))}
                        error={errors.id_status}
                    />

                    {/* IP */}
                    <InputField label="IP" name="ip" value={formData.ip} onChange={handleChange} error={errors.ip} />

                    {/* Fecha de Traslado */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Fecha de Traslado: {formData.transferdate || 'N/A'}
                        </label>
                        <input
                            type="date"
                            name="transferDateInput"
                            value={formData.transferDateInput}
                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded"
                        />
                    </div>

                    {/* Observaciones */}
                    <TextAreaField label="Observaciones" name="observation" value={formData.observation} onChange={handleChange} />

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// 🔹 Reutilizables
function InputField({ label, name, value, onChange, error }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
                id={name}
                name={name}
                type="text"
                value={value}
                onChange={onChange}
                className={`w-full border px-3 py-2 rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}

function TextAreaField({ label, name, value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full border px-3 py-2 rounded"
                rows={3}
            />
        </div>
    );
}

function SelectField({ label, name, value, onChange, options = [], disabled = false, error }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <select
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={`w-full border px-3 py-2 rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
                disabled={disabled}
            >
                <option value="">Selecciona {label.toLowerCase()}</option>
                {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.name}
                    </option>
                ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
