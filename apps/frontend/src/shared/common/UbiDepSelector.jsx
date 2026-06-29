// UbiDepSelector.jsx
import React, { useEffect, useMemo } from "react";
import { useUbicationDepartments } from "../utils/useUbicationDepartments.js";

const Field = ({ label, children, error, hint, htmlFor }) => {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={htmlFor}
                className="block text-sm font-semibold text-gray-800"
            >
                {label}
            </label>

            {children}

            {error ? (
                <div className="flex items-start gap-2 pt-1 text-sm text-red-600">
                    <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold">
                        !
                    </span>
                    <span>{error}</span>
                </div>
            ) : hint ? (
                <p className="pt-1 text-xs text-gray-500">{hint}</p>
            ) : null}
        </div>
    );
};

function UbiDepSelector({
    id_ubication,
    id_department,
    onChange,
    errors = {},
    mode = "incident",
    disabled = false,
    disabledUbication = false,
    disabledDepartment = false,
}) {
    const {
        ubications,
        departments,
        selectedUbication,
        selectedDepartment,
        setSelectedUbication,
        setSelectedDepartment,
    } = useUbicationDepartments();

    const sortedUbications = useMemo(() => {
        const list = Array.isArray(ubications) ? ubications : [];
        return [...list]
            .filter((u) => u && typeof u.name === "string")
            .sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
            );
    }, [ubications]);

    const sortedDepartments = useMemo(() => {
        const list = Array.isArray(departments) ? departments : [];
        return [...list]
            .filter((d) => d && typeof d.name === "string")
            .sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
            );
    }, [departments]);

    useEffect(() => {
        if (mode === "inventory") {
            if (id_ubication) setSelectedUbication(parseInt(id_ubication));

            if (departments && departments.length > 0 && id_department) {
                const idDepNum = parseInt(id_department);
                const depExists = departments.some((dep) => dep && dep.id === idDepNum);
                setSelectedDepartment(depExists ? idDepNum : null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id_ubication, id_department, mode, departments]);

    const baseSelect =
        "w-full appearance-none rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition " +
        "focus:ring-4 focus:ring-blue-100 focus:border-blue-500 " +
        "placeholder:text-gray-400";

    const selectWithError = "border-red-400 focus:border-red-500 focus:ring-red-100";

    const disabledSelect =
        "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed opacity-80";

    const wrapSelect =
        "relative";

    const caret =
        "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400";

    const ubicationDisabled = disabled || disabledUbication;
    const departmentDisabled = disabled || disabledDepartment;

    const handleUbicationChange = (e) => {
        if (ubicationDisabled) return;

        const idUbi = e.target.value ? parseInt(e.target.value) : null;
        setSelectedUbication(idUbi);
        setSelectedDepartment(null);

        const ubication_name =
            (Array.isArray(ubications)
                ? ubications.find((u) => u && u.id === idUbi)?.name
                : "") || "";

        onChange({
            id_ubication: idUbi,
            id_department: null,
            ubication_name,
            department_name: "",
        });
    };

    const handleDepartmentChange = (e) => {
        if (departmentDisabled) return;

        const idDep = e.target.value ? parseInt(e.target.value) : null;
        setSelectedDepartment(idDep);

        const department_name =
            (Array.isArray(departments)
                ? departments.find((d) => d && d.id === idDep)?.name
                : "") || "";

        const ubication_name =
            (Array.isArray(ubications)
                ? ubications.find((u) => u && u.id === selectedUbication)?.name
                : "") || "";

        onChange({
            id_ubication: selectedUbication,
            id_department: idDep,
            ubication_name,
            department_name,
        });
    };

    const depDisabled =
        departmentDisabled || !selectedUbication || sortedDepartments.length === 0;

    return (
        <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-2xl md:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {/* Ubicación */}
                <Field
                    label="Ubicación"
                    htmlFor="id_ubication"
                    error={errors.ubication}
                    hint="Selecciona primero una ubicación para filtrar departamentos."
                >
                    <div className={wrapSelect}>
                        <select
                            id="id_ubication"
                            value={selectedUbication || ""}
                            onChange={handleUbicationChange}
                            disabled={ubicationDisabled}
                            className={`${baseSelect} ${errors.ubication ? selectWithError : "border-gray-300"
                                } ${ubicationDisabled ? disabledSelect : ""}`}
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

                        {/* caret */}
                        <svg
                            className={caret}
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M7 10l5 5 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </Field>

                {/* Departamento */}
                <Field
                    label="Departamento"
                    htmlFor="id_department"
                    error={errors.department}
                    hint={
                        disabled
                            ? "No aplica para equipos descartados."
                            : disabledDepartment
                            ? "No tienes permiso para modificar el departamento."
                            : depDisabled
                            ? "Primero elige una ubicación para habilitar departamentos."
                            : "Selecciona el departamento correspondiente."
                    }
                >
                    <div className={wrapSelect}>
                        <select
                            id="id_department"
                            value={selectedDepartment || ""}
                            onChange={handleDepartmentChange}
                            disabled={depDisabled}
                            aria-invalid={!!errors.department}
                            aria-describedby={errors.department ? "department-error" : undefined}
                            className={`${baseSelect} ${errors.department ? selectWithError : "border-gray-300"
                                } ${depDisabled ? disabledSelect : ""}`}
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

                        <svg
                            className={caret}
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M7 10l5 5 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    {errors.department && (
                        <p id="department-error" className="sr-only">
                            {errors.department}
                        </p>
                    )}
                </Field>
            </div>
        </div>
    );
}

export default UbiDepSelector;
