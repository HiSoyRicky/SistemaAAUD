import { useEffect, useMemo, useReducer, useCallback } from "react";
import { toast } from "react-toastify";
import { incidentFormReducer, INCIDENT_INITIAL_STATE } from "@/components/incidents/forms/incidentFormReducer";

export function useIncidentForm({ loggedUserId, onSubmit }) {
    const [state, dispatch] = useReducer(incidentFormReducer, INCIDENT_INITIAL_STATE);

    const CATEGORY_OPTIONS = useMemo(
        () => [
            { value: "1", label: "Problemas con el internet" },
            { value: "2", label: "Problemas con el equipo" },
            { value: "3", label: "Problemas con un programa" },
            { value: "4", label: "Otro" },
        ],
        []
    );

    const validate = useCallback(() => {
        const { formData } = state;
        const newErrors = {};
        const categoryId = parseInt(formData.id_category);

        if (!formData.reporter_name.trim()) newErrors.reporter_name = "El nombre es obligatorio";
        else if (formData.reporter_name.trim().length < 4) newErrors.reporter_name = "El nombre debe tener al menos 4 caracteres";
        else if (formData.reporter_name.trim().length > 30) newErrors.reporter_name = "El nombre no puede superar los 30 caracteres";

        if (formData.email && !/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
            newErrors.email = "El formato del correo electrónico es inválido";
        }

        if (formData.id_ubication === null || formData.id_ubication === undefined) newErrors.id_ubication = "Seleccione una ubicación";
        if (formData.id_department === null || formData.id_department === undefined) newErrors.id_department = "Seleccione un departamento";

        if (!formData.description || formData.description.trim().length < 10) {
            newErrors.description = "La descripción debe tener al menos 10 caracteres";
        }

        if (!formData.id_category) newErrors.id_category = "Seleccione una categoría";
        if (categoryId === 4 && !formData.other_category_detail.trim()) {
            newErrors.other_category_detail = "Especifique la categoría personalizada";
        }

        dispatch({ type: "SET_ERRORS", payload: newErrors });
        return Object.keys(newErrors).length === 0;
    }, [state]);

    // cargar ubications/departments
    useEffect(() => {
        const load = async () => {
            try {
                const [uRes, dRes] = await Promise.all([
                    fetch("/api/ubications").then(r => r.json()),
                    fetch("/api/departments").then(r => r.json()),
                ]);

                dispatch({
                    type: "SET_OPTIONS",
                    payload: { ubications: uRes || [], departments: dRes || [] },
                });
            } catch (e) {
                toast.error("Error cargando ubicaciones/departamentos");
            }
        };
        load();
    }, []);

    const selectedUbication = useMemo(
        () => state.ubications.find(u => u.id === state.formData.id_ubication)?.name || "N/A",
        [state.ubications, state.formData.id_ubication]
    );

    const selectedDepartment = useMemo(
        () => state.departments.find(d => d.id === state.formData.id_department)?.name || "N/A",
        [state.departments, state.formData.id_department]
    );

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        dispatch({ type: "SET_FIELD", payload: { name, value } });
    }, []);

    const handleUbiDepChange = useCallback(({ id_ubication, id_department }) => {
        dispatch({ type: "SET_UBIDEP", payload: { id_ubication, id_department } });
    }, []);

    const submit = useCallback(async (e) => {
        e.preventDefault();
        if (state.isSubmitting) return;

        if (!validate()) {
            toast.error("Por favor, corrige los errores en el formulario");
            return;
        }

        dispatch({ type: "SUBMIT_START" });

        const fd = state.formData;
        const incidentData = {
            id_user: parseInt(loggedUserId) || 2,
            reporter_name: fd.reporter_name,
            email: fd.email || null,
            id_ubication: fd.id_ubication,
            id_department: fd.id_department,
            id_device: fd.id_device ? parseInt(fd.id_device) : null,
            description: fd.description,
            id_category: parseInt(fd.id_category),
            other_category_detail: fd.id_category === "4" ? fd.other_category_detail : null,
            status: 1,
            solution: "",
            solution_date: null,
            createdAt: new Date().toISOString(),
        };

        try {
            const response = await onSubmit(incidentData);
            const incidentId = response?.id_incident || response?.data?.id_incident;

            if (incidentId) {
                dispatch({ type: "SET_INCIDENT_ID", payload: incidentId });
                dispatch({ type: "OPEN_MODAL" });
            } else {
                dispatch({ type: "SET_ERRORS", payload: { submit: "No se pudo obtener el ID de la incidencia. Inténtalo de nuevo." } });
                dispatch({ type: "OPEN_MODAL" });
            }
        } catch (error) {
            dispatch({ type: "SET_ERRORS", payload: { submit: `Error al enviar la incidencia: ${error.message}` } });
            dispatch({ type: "OPEN_MODAL" });
            toast.error("Error al enviar la incidencia");
        } finally {
            dispatch({ type: "SUBMIT_END" });
        }
    }, [state.isSubmitting, state.formData, loggedUserId, onSubmit, validate]);

    const newIncident = useCallback(() => {
        dispatch({ type: "RESET_FORM" });
    }, []);

    return {
        state,
        CATEGORY_OPTIONS,
        selectedUbication,
        selectedDepartment,
        handleChange,
        handleUbiDepChange,
        submit,
        newIncident,
        dispatch,
    };
}
