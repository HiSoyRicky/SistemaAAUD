// useIncidentForm.js

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incidentSchema } from "../schemas/incident.schema";
import { toast } from "react-toastify";

export function useIncidentForm({ loggedUserId, onSubmit }) {
    const [showModal, setShowModal] = useState(false);
    const [incidentId, setIncidentId] = useState(null);
    const [selectedUbication, setSelectedUbication] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
        setError,
        clearErrors
    } = useForm({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            reporter_name: "",
            email: "",
            id_ubication: "",
            id_department: "",
            id_device: "",
            description: "",
            id_category: "",
            other_category_detail: ""
        }
    });

    const handleUbiDepChange = ({
        id_ubication,
        id_department,
        ubication_name,
        department_name
    }) => {
        setValue("id_ubication", id_ubication ?? "", {
            shouldValidate: true,
            shouldDirty: true
        });
        setValue("id_department", id_department ?? "", {
            shouldValidate: true,
            shouldDirty: true
        });

        setSelectedUbication(ubication_name || "");
        setSelectedDepartment(department_name || "");
        clearErrors(["id_ubication", "id_department"]);
    };

    const submit = handleSubmit(async (data) => {
        clearErrors("root");

        try {
            const payload = {
                ...data,
                id_user: Number(loggedUserId),
                email: data.email || null,
                status: "Pendiente",
                solution: "",
                solution_date: null
            };

            const response = await onSubmit(payload);

            if (response?.id_incident) {
                setIncidentId(response);
                setShowModal(true);
                toast.success("Incidencia creada");
                return;
            }

            toast.success("Incidencia enviada");
        } catch (err) {
            const message =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Error al enviar incidencia";

            setError("root", { type: "manual", message });
            toast.error(message);
        }
    });

    const newIncident = () => {
        reset();
        setShowModal(false);
        setIncidentId(null);
        setSelectedUbication("");
        setSelectedDepartment("");
        clearErrors();
    };

    return {
        register,
        submit,
        errors,
        isSubmitting,
        watch,
        showModal,
        incidentId,
        selectedUbication,
        selectedDepartment,
        handleUbiDepChange,
        newIncident
    };
}
