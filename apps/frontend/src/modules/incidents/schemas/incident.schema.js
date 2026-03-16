// incident.schema.js
import { z } from "zod";

export const incidentSchema = z.object({
    reporter_name: z.string()
        .min(4, "El nombre debe tener al menos 4 caracteres")
        .max(30, "El nombre no puede superar los 30 caracteres"),

    email: z.string()
        .email("Correo inválido")
        .optional()
        .or(z.literal("")),

    id_ubication: z.coerce.number().min(1, "Seleccione una ubicación"),
    id_department: z.coerce.number().min(1, "Seleccione un departamento"),
    id_device: z.coerce.number().optional().nullable(),

    description: z.string()
        .min(10, "La descripción debe tener al menos 10 caracteres"),

    id_category: z.coerce.number(),
    other_category_detail: z.string().optional(),
}).refine(data => {
    if (data.id_category === 4 && !data.other_category_detail?.trim()) {
        return false;
    }
    return true;
}, {
    message: "Especifique la categoría personalizada",
    path: ["other_category_detail"]
});