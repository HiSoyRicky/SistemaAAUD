// UbiDepSelector.jsx
import React, { useEffect, useMemo } from 'react';
import { useUbicationDepartments } from '@/utils/useUbicationDepartments';

function UbiDepSelector({ id_ubication, id_department, onChange, errors = {}, mode = "incident" }) {
    const {
        ubications,
        departments,
        selectedUbication,
        selectedDepartment,
        setSelectedUbication,
        setSelectedDepartment
    } = useUbicationDepartments();

    // Ubicaciones ordenadas (defensivo)
    const sortedUbications = useMemo(() => {
        const list = Array.isArray(ubications) ? ubications : [];

        return [...list]
            .filter(u => u && typeof u.name === 'string') // evita undefined / sin name
            .sort((a, b) =>
                (a.name || '').localeCompare(b.name || '', 'es', {
                    sensitivity: 'base',
                })
            );
    }, [ubications]);

    // Departamentos ordenados (defensivo)
    const sortedDepartments = useMemo(() => {
        const list = Array.isArray(departments) ? departments : [];

        return [...list]
            .filter(d => d && typeof d.name === 'string')
            .sort((a, b) =>
                (a.name || '').localeCompare(b.name || '', 'es', {
                    sensitivity: 'base',
                })
            );
    }, [departments]);

    // Sincronizar valores iniciales según el modo
    useEffect(() => {
        if (mode === "inventory") {
            if (id_ubication) {
                setSelectedUbication(parseInt(id_ubication));
            }

            if (departments && departments.length > 0 && id_department) {
                const idDepNum = parseInt(id_department);
                const depExists = departments.some(dep => dep && dep.id === idDepNum);
                if (depExists) {
                    setSelectedDepartment(idDepNum);
                } else {
                    setSelectedDepartment(null);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id_ubication, id_department, mode, departments]);

    const handleUbicationChange = (e) => {
        const idUbi = e.target.value ? parseInt(e.target.value) : null;
        setSelectedUbication(idUbi);
        setSelectedDepartment(null);

        const ubication_name =
            (Array.isArray(ubications)
                ? ubications.find(u => u && u.id === idUbi)?.name
                : '') || '';

        onChange({
            id_ubication: idUbi,
            id_department: null,
            ubication_name,
            department_name: ''
        });
    };

    const handleDepartmentChange = (e) => {
        const idDep = e.target.value ? parseInt(e.target.value) : null;
        setSelectedDepartment(idDep);

        const department_name =
            (Array.isArray(departments)
                ? departments.find(d => d && d.id === idDep)?.name
                : '') || '';

        const ubication_name =
            (Array.isArray(ubications)
                ? ubications.find(u => u && u.id === selectedUbication)?.name
                : '') || '';

        onChange({
            id_ubication: selectedUbication,
            id_department: idDep,
            ubication_name,
            department_name
        });
    };

    return (
        <div className="space-y-4">
            {/* Ubicación */}
            <div>
                <label className="block mb-1 text-sm font-bold text-gray-700">
                    Ubicación:
                </label>
                <select
                    id="id_ubication"
                    value={selectedUbication || ''}
                    onChange={handleUbicationChange}
                    className={`w-full border rounded px-4 py-2 ${
                        errors.ubication ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                    <option value="" disabled>
                        -- Seleccione una ubicación --
                    </option>
                    {sortedUbications.map((ubi) => (
                        <option key={ubi.id} value={ubi.id}>
                            {ubi.name}
                        </option>
                    ))}
                </select>
                {errors.ubication && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.ubication}
                    </p>
                )}
            </div>

            {/* Departamento */}
            <div>
                <label
                    htmlFor="id_department"
                    className="block mb-1 text-sm font-bold text-gray-700"
                >
                    Departamento:
                </label>
                <select
                    id="id_department"
                    value={selectedDepartment || ''}
                    onChange={handleDepartmentChange}
                    disabled={!selectedUbication || sortedDepartments.length === 0}
                    className={`w-full border rounded px-4 py-2 ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                    } ${
                        !selectedUbication || sortedDepartments.length === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                    }`}
                    aria-invalid={!!errors.department}
                    aria-describedby={errors.department ? 'department-error' : undefined}
                >
                    <option value="" disabled>
                        -- Seleccione un departamento --
                    </option>
                    {sortedDepartments.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                            {dep.name}
                        </option>
                    ))}
                </select>
                {errors.department && (
                    <p id="department-error" className="mt-1 text-sm text-red-500">
                        {errors.department}
                    </p>
                )}
            </div>
        </div>
    );
}

export default UbiDepSelector;
