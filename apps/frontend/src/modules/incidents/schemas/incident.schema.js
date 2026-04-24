// incident.schema.js
import { z } from "zod";

const TONER_COLORS = ["BLACK", "CYAN", "MAGENTA", "YELLOW"];

const optionalPositiveInt = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : value;
}, z.number().int().positive().optional());

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
    id_device: optionalPositiveInt,
    id_printer_model: optionalPositiveInt,
    id_toner: optionalPositiveInt,
    toner_color: z.preprocess((value) => {
        if (value === "" || value === null || value === undefined) {
            return undefined;
        }
        return String(value).trim().toUpperCase();
    }, z.enum(TONER_COLORS).optional()),

    description: z.string()
        .min(10, "La descripción debe tener al menos 10 caracteres"),

    id_category: z.coerce.number(),
    other_category_detail: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.id_category === 4 && !data.other_category_detail?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Especifique la categoría personalizada",
            path: ["other_category_detail"]
        });
    }

    if (data.id_category === 5) {
        if (!data.id_printer_model) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Seleccione una impresora",
                path: ["id_printer_model"]
            });
        }

        if (!data.toner_color) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Seleccione el color del tóner",
                path: ["toner_color"]
            });
        }
    }
});
