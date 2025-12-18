// InventoryFormModal.jsx
import React, { useState, useEffect } from 'react';
import UbiDepSelector from '@/components/UbiDepSelector';
import { formatDateToDDMMYYYY } from '@/utils/formatDate';
import { Inventory } from '@/services/api';

export default function InventoryFormModal({ initialData = {}, onCancel, onSubmit }) {
    const isEdit = !!initialData.id;

    const [formData, setFormData] = useState({
        tag: initialData.tag || '',
        id_ubication: initialData.id_ubication || null,
        id_department: initialData.id_department || null,
        user: initialData.user || '',
        id_device: initialData.id_device,
        id_brand: initialData.id_brand,
        id_model: initialData.id_model,
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
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const ALLOWED_STATUS = ['Buen estado', 'Mal estado', 'Para descarte', 'Nuevo', 'Descartado'];

    //  Cargar opciones para los selectores
    useEffect(() => {
        async function fetchOptions() {
            try {
                setLoadingOptions(true);
                const [devices, brands, models, statuses] = await Promise.all([
                    Inventory.fetchDeviceTypes(),
                    Inventory.fetchBrands(),
                    Inventory.fetchModels(),
                    Inventory.fetchStatuses()
                ]);
                setOptions({ devices, brands, models, statuses });
            } catch (error) {
                console.error('Error fetching options:', error);
                setFetchError('Error al cargar opciones. Verifica la conexión o el backend.');
            } finally {
                setLoadingOptions(false);
            }
        }
        fetchOptions();
    }, []);

    // Filtra IDs de marcas por el equipo seleccionado
    const filteredBrandIds = options.models
        .filter(m => String(m.id_device) === String(formData.id_device))
        .map(m => m.id_brand);

    // Filtra marcas por el equipo seleccionado
    const filteredBrands = options.brands.filter(b =>
        filteredBrandIds.includes(b.id)
    );

    // Filtra modelos por marca Y por el equipo seleccionado
    const filteredModels = options.models.filter(
        (m) =>
            String(m.id_brand) === String(formData.id_brand) &&
            String(m.id_device) === String(formData.id_device)
    );

    // Manejo de cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'transferDateInput') {
            const date = value ? new Date(value + 'T00:00:00Z') : null;
            setFormData((prev) => ({
                ...prev,
                [name]: value,
                transferdate: date ? formatDateToDDMMYYYY(date) : ''
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // Manejo de cambios en ubicación y departamento desde UbiDepSelector
    const handleUbiDepChange = ({ id_ubication, id_department }) => {
        setFormData((prev) => ({
            ...prev,
            id_ubication: id_ubication ? parseInt(id_ubication) : null,
            id_department: id_department ? parseInt(id_department) : null
        }));
        setErrors((prev) => ({ ...prev, id_ubication: '', id_department: '' }));
    };

    // Validación y envío del formulario
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
        if (
            formData.ip &&
            formData.ip.trim() !== '' &&
            !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(formData.ip)
        ) newErrors.ip = 'La IP no es válida';

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const transferdate = formData.transferDateInput
                ? new Date(formData.transferDateInput + 'T00:00:00Z').toISOString()
                : null;

            const submitData = {
                ...formData,
                transferdate,
                user: formData.user.trim() === '' ? null : formData.user,
                ip: formData.ip.trim() === '' ? null : formData.ip,
                observation: formData.observation.trim() === '' ? null : formData.observation
            };

            onSubmit(submitData);
        }
    };

    // Manejo de error en fetch de opciones
    if (fetchError) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-40">
                <div className="w-full max-w-lg p-6 bg-white shadow-xl rounded-xl">
                    <p className="text-red-500">{fetchError}</p>
                    <button onClick={onCancel} className="px-4 py-2 mt-4 bg-gray-300 rounded">
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    const LOCKED_ON_EDIT = new Set([
        'tag',
        'id_device',
        'id_brand',
        'id_model',
        'serie',
        'id_ubication',
        'id_department',
    ]);

    const EDITABLE_ALWAYS = new Set([
        'user',
        'ip',
        'id_status',
        'transferDateInput',
        'observation',
    ]);

    const [safeMode, setSafeMode] = useState(isEdit ? true : false); // en editar arranca seguro
    const [unlocked, setUnlocked] = useState(() => ({})); // { tag:true, ip:true ... }

    const isFieldLocked = (name) => {
        if (!isEdit) return false; // en crear todo normal
        if (EDITABLE_ALWAYS.has(name)) return false; // estos siempre editables si quieres
        if (!LOCKED_ON_EDIT.has(name)) return false; // si no está en lista, no bloquees
        return safeMode && !unlocked[name]; // bloqueado si modo seguro y no lo has desbloqueado
    };

    const toggleField = (name) => {
        setUnlocked(prev => ({ ...prev, [name]: !prev[name] }));
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
            <div className="relative w-full max-w-5xl p-6 bg-white shadow-2xl rounded-2xl md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold md:text-2xl">
                        {isEdit ? `Editar Equipo #${formData.tag}` : 'Agregar Equipo al Inventario'}
                    </h3>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xl text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {isEdit && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Edición segura</span>
                        <button
                            type="button"
                            onClick={() => setSafeMode((v) => !v)}
                            className={`px-3 py-1 text-xs rounded-full border ${safeMode ? 'bg-gray-100 text-gray-700' : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                            title={safeMode ? 'Modo seguro (bloqueado)' : 'Modo libre (todo editable)'}
                        >
                            {safeMode ? 'Activado' : 'Desactivado'}
                        </button>
                    </div>
                )}


                {loadingOptions ? (
                    <p className="text-center">Cargando opciones...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Fila 1: Marbete / Usuario / Estado */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <InputField
                                label="Marbete *"
                                name="tag"
                                value={formData.tag}
                                onChange={handleChange}
                                error={errors.tag}
                                locked={isFieldLocked('tag')}
                                onToggle={() => toggleField('tag')}
                            />

                            <InputField
                                label="Usuario asignado"
                                name="user"
                                value={formData.user}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="Estado *"
                                name="id_status"
                                value={formData.id_status}
                                onChange={handleChange}
                                options={options.statuses
                                    .filter((s) => ALLOWED_STATUS.includes(s.name))
                                    .map((s) => ({ id: s.id, name: s.name }))}
                                error={errors.id_status}
                            />
                        </div>

                        {/* Fila 2: Ubicación / Departamento */}
                        <div className="p-3 border rounded-xl bg-gray-50">
                            <p className="mb-2 text-sm font-semibold text-gray-700">
                                Ubicación y Departamento *
                            </p>
                            <UbiDepSelector
                                id_ubication={formData.id_ubication}
                                id_department={formData.id_department}
                                onChange={handleUbiDepChange}
                                errors={{
                                    ubication: errors.id_ubication,
                                    department: errors.id_department
                                }}
                                mode="inventory"
                            />
                        </div>

                        {/* Fila 3: Equipo / Marca / Modelo */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <SelectField
                                label="Nombre del equipo *"
                                name="id_device"
                                value={formData.id_device}
                                onChange={handleChange}
                                options={options.devices.map((d) => ({ id: d.id, name: d.name }))}
                                error={errors.id_device}
                                locked={isFieldLocked('id_device')}
                                onToggle={() => toggleField('id_device')}
                            />
                            <SelectField
                                label="Marca *"
                                name="id_brand"
                                value={formData.id_brand}
                                onChange={(e) => {
                                    handleChange(e);
                                    setFormData((prev) => ({ ...prev, id_model: '' }));
                                }}
                                options={filteredBrands.map((b) => ({ id: b.id, name: b.name }))}
                                error={errors.id_brand}
                                disabled={!formData.id_device}
                                locked={isFieldLocked('id_brand')}
                                onToggle={() => toggleField('id_brand')}
                            />
                            <SelectField
                                label="Modelo *"
                                name="id_model"
                                value={formData.id_model}
                                onChange={handleChange}
                                options={filteredModels.map((m) => ({ id: m.id, name: m.name }))}
                                error={errors.id_model}
                                disabled={!formData.id_brand}
                                locked={isFieldLocked('id_model')}
                                onToggle={() => toggleField('id_model')}
                            />
                        </div>

                        {/* Fila 4: Serie / IP / Fecha traslado */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <InputField
                                label="Serie *"
                                name="serie"
                                value={formData.serie}
                                onChange={handleChange}
                                error={errors.serie}
                                locked={isFieldLocked('serie')}
                                onToggle={() => toggleField('serie')}
                            />
                            <InputField
                                label="IP"
                                name="ip"
                                value={formData.ip}
                                onChange={handleChange}
                                error={errors.ip}
                            />
                            <div>
                                <label className="block mb-1 text-sm font-medium">
                                    Fecha de Traslado
                                </label>
                                <input
                                    type="date"
                                    name="transferDateInput"
                                    value={formData.transferDateInput}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                            </div>
                        </div>

                        {/* Fila 5: Observaciones */}
                        <TextAreaField
                            label="Observaciones / Ubicación Anterior"
                            name="observation"
                            value={formData.observation}
                            onChange={handleChange}
                        />

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

//  Reutilizables
function InputField({ label, name, value, onChange, error, locked, onToggle }) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-sm font-medium">{label}</label>

                {locked !== undefined && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        {locked ? 'Editar' : 'Bloquear'}
                    </button>
                )}
            </div>

            <input
                id={name}
                name={name}
                type="text"
                value={value}
                onChange={onChange}
                disabled={!!locked}
                className={`w-full border px-3 py-2 rounded text-sm ${error ? 'border-red-500' : 'border-gray-300'
                    } ${locked ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}


function TextAreaField({ label, name, value, onChange }) {
    return (
        <div>
            <label className="block mb-1 text-sm font-medium">{label}</label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                rows={3}
            />
        </div>
    );
}

function SelectField({ label, name, value, onChange, options = [], disabled = false, error, locked, onToggle }) {
    const finalDisabled = disabled || !!locked;

    return (
        <div>
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-sm font-medium">{label}</label>

                {locked !== undefined && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        {locked ? 'Editar' : 'Bloquear'}
                    </button>
                )}
            </div>

            <select
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                disabled={finalDisabled}
                className={`w-full border px-3 py-2 rounded text-sm ${error ? 'border-red-500' : 'border-gray-300'
                    } ${finalDisabled ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
            >
                <option value="">Selecciona {label.toLowerCase()}</option>
                {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.name}
                    </option>
                ))}
            </select>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}