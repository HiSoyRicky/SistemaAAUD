// src/components/inventory/InventoryForm.jsx
import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { useInventoryData } from '../../hooks/useinventoryData';
import UbiDepSelector from '../UbiDepSelector';
import { formatDateToDDMMYYYY } from '../../utils/formatDate';

export default function InventoryForm({ onSubmit, onCancel, initialData = {} }) {
    const { userType } = useAuth();
    // En el destructuring de useInventoryData
    const { departments = [], ubications = [], brands = [], models = [], statuses = [], devices = [], loading } = useInventoryData();

    const [formData, setFormData] = useState({
        tag: initialData.tag || '',
        serie: initialData.serie || '',
        id_device: initialData.id_device || '',
        descripcion: initialData.descripcion || '',
        id_ubication: initialData.id_ubication || '',
        id_department: initialData.id_department || '',
        id_brand: initialData.id_brand || '',
        id_model: initialData.id_model || '',
        id_status: initialData.id_status || '',
        user: initialData.user || '',
        ip: initialData.ip || '',
        transferdate: initialData.transferdate ? formatDateToDDMMYYYY(initialData.transferdate) : '',
        transferDateInput: initialData.transferdate
            ? new Date(initialData.transferdate).toISOString().split('T')[0]
            : ''
    });
    const [errors, setErrors] = useState({});

    // 🔹 Filtrar modelos según la marca seleccionada
    const filteredModels = models.filter(
        (m) => String(m.id_brand) === String(formData.id_brand)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'transferDateInput') {
            const date = value ? new Date(value + 'T00:00:00Z') : null;
            setFormData((prev) => ({
                ...prev,
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
        if (!formData.serie.trim()) newErrors.serie = 'La serie es obligatoria';
        if (!formData.nombre_equipo.trim()) newErrors.nombre_equipo = 'El nombre del equipo es obligatorio';
        if (formData.ip && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(formData.ip)) newErrors.ip = 'La IP no es válida';
        if (!formData.id_ubication) newErrors.id_ubication = 'Seleccione una ubicación';
        if (!formData.id_department) newErrors.id_department = 'Seleccione un departamento';

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const transferdate = formData.transferDateInput
                ? new Date(formData.transferDateInput + 'T00:00:00Z').toISOString()
                : null;

            onSubmit({
                ...formData,
                transferdate
            });
        }
    };

    const handleCancel = () => {
        if (window.confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
            onCancel();
        }
    };

    if (loading || !devices) return <div>Cargando datos...</div>;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold mb-4">{initialData.id ? 'Editar Equipo' : 'Agregar Equipo'}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Marbete */}
                    <div className="col-span-2">
                        <InputField
                            label="Marbete *"
                            name="tag"
                            value={formData.tag}
                            onChange={handleChange}
                            error={errors.tag}
                        />
                    </div>

                    {/* Serie */}
                    <InputField
                        label="Serie *"
                        name="serie"
                        value={formData.serie}
                        onChange={handleChange}
                        error={errors.serie}
                    />

                    {/* Nombre del equipo - select */}
                    <div className="col-span-2">
                        <SelectField
                            label="Nombre del equipo *"
                            name="id_device"
                            value={formData.id_device}
                            onChange={handleChange}
                            options={(devices || []).map((d) => ({ id: d.id, name: d.name }))}
                            error={errors.id_device}
                        />
                    </div>

                    {/* Ubicación y Departamento */}
                    <div className="col-span-2">
                        <UbiDepSelector
                            id_ubication={formData.id_ubication}
                            id_department={formData.id_department}
                            onChange={handleUbiDepChange}
                            errors={{ ubication: errors.id_ubication, department: errors.id_department }}
                            mode="inventory"
                        />
                    </div>

                    {userType === 'admin' && (
                        <>
                            {/* Marca */}
                            <SelectField
                                label="Marca"
                                name="id_brand"
                                value={formData.id_brand}
                                onChange={(e) => {
                                    handleChange(e);
                                    setFormData((prev) => ({ ...prev, id_model: '' }));
                                }}
                                options={brands}
                            />

                            {/* Modelo filtrado */}
                            <SelectField
                                label="Modelo"
                                name="id_model"
                                value={formData.id_model}
                                onChange={handleChange}
                                options={filteredModels}
                                disabled={!formData.id_brand}
                            />

                            {/* Estado */}
                            <SelectField
                                label="Estado"
                                name="id_status"
                                value={formData.id_status}
                                onChange={handleChange}
                                options={statuses}
                            />
                        </>
                    )}

                    {/* Usuario */}
                    <InputField
                        label="Usuario asignado"
                        name="user"
                        value={formData.user}
                        onChange={handleChange}
                    />

                    {/* IP */}
                    <InputField
                        label="IP"
                        name="ip"
                        value={formData.ip}
                        onChange={handleChange}
                        error={errors.ip}
                    />

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
                    <TextAreaField
                        label="Observaciones"
                        name="observation"
                        value={formData.observation}
                        onChange={handleChange}
                    />

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
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

// 🔹 Componentes reutilizables
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
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            {error && <p id={`${name}-error`} className="text-red-500 text-sm mt-1">{error}</p>}
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

function SelectField({ label, name, value, onChange, options = [], disabled = false }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full border px-3 py-2 rounded"
                disabled={disabled}
            >
                <option value="">Selecciona {label.toLowerCase()}</option>
                {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.name || opt.nombre}
                    </option>
                ))}
            </select>
        </div>
    );
}