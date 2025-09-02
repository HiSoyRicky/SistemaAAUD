// src/components/UbiDepSelector.jsx
import React, { useEffect } from 'react';
import { useUbicationDepartments } from '../utils/useUbicationDepartments';

function UbiDepSelector({ id_ubication, id_department, onChange, errors = {}, mode = "incident" }) {
    const {
        ubications,
        departments,
        selectedUbication,
        selectedDepartment,
        setSelectedUbication,
        setSelectedDepartment
    } = useUbicationDepartments();

    // Sincronizar valores iniciales según el modo
    useEffect(() => {
        if (mode === "inventory") {
            if (id_ubication != null) setSelectedUbication(parseInt(id_ubication));
            const depExists = departments.some(dep => dep.id === parseInt(id_department));
            if (depExists) {
                setSelectedDepartment(parseInt(id_department));
            } else {
                setSelectedDepartment(null);
            }
        }
    }, [id_ubication, id_department, mode, setSelectedUbication, setSelectedDepartment]);

    const handleUbicationChange = (e) => {
        const idUbi = e.target.value ? parseInt(e.target.value) : null;
        setSelectedUbication(idUbi);
        setSelectedDepartment(null);
        const ubication_name = ubications.find(u => u.id === idUbi)?.name || '';
        onChange({ id_ubication: idUbi, id_department: null, ubication_name, department_name: '' });
    };

    const handleDepartmentChange = (e) => {
        const idDep = e.target.value ? parseInt(e.target.value) : null;
        setSelectedDepartment(idDep);
        const department_name = departments.find(d => d.id === idDep)?.name || '';
        const ubication_name = ubications.find(u => u.id === selectedUbication)?.name || '';
        onChange({ id_ubication: selectedUbication, id_department: idDep, ubication_name, department_name });
    };

    return (
        <div className="space-y-4">

            {/* Ubicación */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ubicación: </label>
                <select
                    id="id_ubication"
                    value={selectedUbication || ''}
                    onChange={handleUbicationChange}
                    className={`w-full border rounded px-4 py-2 ${errors.ubication ?
                        'border-red-500' : ''}`}
                >
                    <option value="" disabled>
                        -- Seleccione una ubicación --
                    </option>
                    {ubications.map((ubi) => (
                        <option
                            key={ubi.id} value={ubi.id}>
                            {ubi.name}
                        </option>
                    ))}
                </select>
                {errors.ubication && <p className="text-red-500 text-sm mt-1">
                    {errors.ubication}</p>}
            </div>

            {/* Departamento */}
            <div>
                <label htmlFor="id_department" className="block text-sm font-bold text-gray-700 mb-1">
                    Departamento:
                </label>
                <select
                    id="id_department"
                    value={selectedDepartment || ''}
                    onChange={handleDepartmentChange}
                    disabled={!selectedUbication || departments.length === 0}
                    className={`w-full border rounded px-4 py-2 ${errors.department ? 'border-red-500' : 'border-gray-300'
                        } ${!selectedUbication || departments.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-invalid={!!errors.department}
                    aria-describedby={errors.department ? 'department-error' : undefined}
                >
                    <option value="" disabled>
                        -- Seleccione un departamento --
                    </option>
                    {departments.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                            {dep.name}
                        </option>
                    ))}
                </select>
                {errors.department && (
                    <p id="department-error" className="text-red-500 text-sm mt-1">
                        {errors.department}
                    </p>
                )}
            </div>
        </div>
    );
}

export default UbiDepSelector;