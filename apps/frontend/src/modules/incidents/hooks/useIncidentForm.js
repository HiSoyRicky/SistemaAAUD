// useIncidentForm.js

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incidentSchema } from "../schemas/incident.schema";
import { toast } from "react-toastify";
import { Incidents } from "../services/incidents.api";

const TONER_CATEGORY_ID = 5;

const TONER_COLOR_LABELS = {
    BLACK: "Negro",
    CYAN: "Cian",
    MAGENTA: "Magenta",
    YELLOW: "Amarillo",
};

export function useIncidentForm({ loggedUserId, onSubmit }) {
    const [showModal, setShowModal] = useState(false);
    const [incidentId, setIncidentId] = useState(null);
    const [selectedUbication, setSelectedUbication] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [tonerPrinters, setTonerPrinters] = useState([]);
    const [isLoadingTonerOptions, setIsLoadingTonerOptions] = useState(false);
    const [tonerOptionsError, setTonerOptionsError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
        getValues,
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
            other_category_detail: "",
            id_printer_model: "",
            toner_color: "",
            id_toner: ""
        }
    });

    const selectedCategory = watch("id_category");
    const selectedUbicationId = watch("id_ubication");
    const selectedDepartmentId = watch("id_department");
    const selectedPrinterModelId = watch("id_printer_model");
    const selectedTonerColor = watch("toner_color");

    const isTonerCategory = Number(selectedCategory) === TONER_CATEGORY_ID;

    const setFieldValueIfChanged = (fieldName, nextValue, options) => {
        const currentValue = getValues(fieldName);
        if (String(currentValue ?? "") === String(nextValue ?? "")) {
            return;
        }
        setValue(fieldName, nextValue, options);
    };

    const selectedPrinter = useMemo(() => {
        const printerId = Number(selectedPrinterModelId);
        if (!printerId) return null;

        return (
            tonerPrinters.find(
                (printer) => Number(printer.id_printer_model) === printerId
            ) || null
        );
    }, [selectedPrinterModelId, tonerPrinters]);

    const availableTonerColors = useMemo(() => {
        const toners = Array.isArray(selectedPrinter?.toners)
            ? selectedPrinter.toners
            : [];

        return toners.map((toner) => ({
            color: toner.color,
            label: TONER_COLOR_LABELS[toner.color] || toner.color,
            toner_model: toner.toner_model || "",
            id_toner: toner.id_toner
        }));
    }, [selectedPrinter]);

    useEffect(() => {
        if (isTonerCategory) {
            return;
        }

        setTonerPrinters([]);
        setIsLoadingTonerOptions(false);
        setTonerOptionsError("");
        clearErrors(["id_printer_model", "toner_color"]);
        setFieldValueIfChanged("id_printer_model", "", {
            shouldValidate: false,
            shouldDirty: false
        });
        setFieldValueIfChanged("toner_color", "", {
            shouldValidate: false,
            shouldDirty: false
        });
        setFieldValueIfChanged("id_toner", "", {
            shouldValidate: false,
            shouldDirty: false
        });
    }, [clearErrors, isTonerCategory]);

    useEffect(() => {
        if (!isTonerCategory) return;

        const id_ubication = Number(selectedUbicationId);
        const id_department = Number(selectedDepartmentId);

        if (!id_ubication || !id_department) {
            setTonerPrinters([]);
            setIsLoadingTonerOptions(false);
            setTonerOptionsError("");
            setFieldValueIfChanged("id_printer_model", "", {
                shouldValidate: true,
                shouldDirty: true
            });
            setFieldValueIfChanged("toner_color", "", {
                shouldValidate: true,
                shouldDirty: true
            });
            setFieldValueIfChanged("id_toner", "", {
                shouldValidate: false,
                shouldDirty: true
            });
            setFieldValueIfChanged("description", "", {
                shouldValidate: true,
                shouldDirty: true
            });
            return;
        }

        let ignore = false;

        const loadTonerOptions = async () => {
            setIsLoadingTonerOptions(true);
            setTonerOptionsError("");

            try {
                const response = await Incidents.fetchTonerOptions({
                    id_ubication,
                    id_department
                });

                if (ignore) return;

                const printers = Array.isArray(response?.printers)
                    ? response.printers
                    : [];

                setTonerPrinters(printers);

                if (printers.length === 0) {
                    setTonerOptionsError(
                        "No hay impresoras con tóner configurado para el departamento seleccionado."
                    );
                }

                const currentPrinterId = Number(getValues("id_printer_model"));
                const printerStillAvailable = printers.some(
                    (printer) => Number(printer.id_printer_model) === currentPrinterId
                );

                if (!printerStillAvailable) {
                    const nextPrinterId =
                        printers.length === 1 ? String(printers[0].id_printer_model) : "";

                    setFieldValueIfChanged("id_printer_model", nextPrinterId, {
                        shouldValidate: true,
                        shouldDirty: true
                    });
                    setFieldValueIfChanged("toner_color", "", {
                        shouldValidate: true,
                        shouldDirty: true
                    });
                    setFieldValueIfChanged("id_toner", "", {
                        shouldValidate: false,
                        shouldDirty: true
                    });
                    setFieldValueIfChanged("description", "", {
                        shouldValidate: true,
                        shouldDirty: true
                    });
                }
            } catch (error) {
                if (ignore) return;

                const message =
                    error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    "No fue posible cargar las impresoras para solicitud de tóner.";

                setTonerPrinters([]);
                setTonerOptionsError(message);
            } finally {
                if (!ignore) {
                    setIsLoadingTonerOptions(false);
                }
            }
        };

        loadTonerOptions();

        return () => {
            ignore = true;
        };
    }, [getValues, isTonerCategory, selectedDepartmentId, selectedUbicationId]);

    useEffect(() => {
        if (!isTonerCategory) return;

        const toners = Array.isArray(selectedPrinter?.toners)
            ? selectedPrinter.toners
            : [];

        if (!selectedPrinter || toners.length === 0) {
            setFieldValueIfChanged("toner_color", "", {
                shouldValidate: true,
                shouldDirty: true
            });
            setFieldValueIfChanged("id_toner", "", {
                shouldValidate: false,
                shouldDirty: true
            });
            setFieldValueIfChanged("description", "", {
                shouldValidate: true,
                shouldDirty: true
            });
            return;
        }

        const currentColor = String(selectedTonerColor || "").trim().toUpperCase();
        const colorExists = toners.some((toner) => toner.color === currentColor);

        if (colorExists) return;

        if (toners.length === 1) {
            setFieldValueIfChanged("toner_color", toners[0].color, {
                shouldValidate: true,
                shouldDirty: true
            });
            clearErrors("toner_color");
            return;
        }

        setFieldValueIfChanged("toner_color", "", {
            shouldValidate: true,
            shouldDirty: true
        });
        setFieldValueIfChanged("id_toner", "", {
            shouldValidate: false,
            shouldDirty: true
        });
        setFieldValueIfChanged("description", "", {
            shouldValidate: true,
            shouldDirty: true
        });
    }, [clearErrors, isTonerCategory, selectedPrinter, selectedTonerColor]);

    useEffect(() => {
        if (!isTonerCategory) return;

        const color = String(selectedTonerColor || "").trim().toUpperCase();
        const toner = selectedPrinter?.toners?.find((item) => item.color === color);

        if (!selectedPrinter || !toner) {
            setFieldValueIfChanged("id_toner", "", {
                shouldValidate: false,
                shouldDirty: true
            });
            return;
        }

        setFieldValueIfChanged("id_toner", String(toner.id_toner), {
            shouldValidate: false,
            shouldDirty: true
        });

        const brand = selectedPrinter.brand || "Sin marca";
        const printerModel = selectedPrinter.printer_model || "Sin modelo";
        const colorLabel = TONER_COLOR_LABELS[color] || color;
        const tonerModel = toner.toner_model || `Tóner ${colorLabel}`;
        const autoDescription = `${brand} | ${printerModel} | ${tonerModel} (${colorLabel})`;

        setFieldValueIfChanged("description", autoDescription, {
            shouldValidate: true,
            shouldDirty: true
        });
        clearErrors(["description", "toner_color"]);
    }, [clearErrors, isTonerCategory, selectedPrinter, selectedTonerColor]);

    
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
        clearErrors(["id_ubication", "id_department", "id_printer_model", "toner_color"]);

        if (isTonerCategory) {
            setFieldValueIfChanged("id_printer_model", "", {
                shouldValidate: true,
                shouldDirty: true
            });
            setFieldValueIfChanged("toner_color", "", {
                shouldValidate: true,
                shouldDirty: true
            });
            setFieldValueIfChanged("id_toner", "", {
                shouldValidate: false,
                shouldDirty: true
            });
            setFieldValueIfChanged("description", "", {
                shouldValidate: true,
                shouldDirty: true
            });
        }
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
        setTonerPrinters([]);
        setIsLoadingTonerOptions(false);
        setTonerOptionsError("");
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
        isTonerCategory,
        tonerPrinters,
        availableTonerColors,
        isLoadingTonerOptions,
        tonerOptionsError,
        selectedUbication,
        selectedDepartment,
        handleUbiDepChange,
        newIncident
    };
}
