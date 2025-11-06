const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { body, validationResult } = require("express-validator");

//  Validación middleware
const validateToner = [
    body("id_printer_model").notEmpty().withMessage("El id del modelo de impresora es requerido"),
    body("id_toner_model").notEmpty().withMessage("El id del modelo de tóner es requerido"),
    body("id_color").notEmpty().withMessage("El id del color es requerido"),
    body("stock").optional().isInt({ min: 0 }).withMessage("El stock debe ser un número entero mayor o igual a 0"),
    body("status").optional().isString().withMessage("El estado debe ser un texto"),
];

// Crear tóner
router.post("/", validateToner, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        throw new AppError(firstError.msg, 400);
    }

    const { id_printer_model, id_toner_model, id_color, stock = 0, status = "Disponible" } = req.body;

    if (!id_printer_model || !id_toner_model || !id_color) {
        throw new AppError("Faltan datos obligatorios", 400);
    }

    const newToner = await prisma.toners.create({
        data: {
            id_printer_model,
            id_toner_model,
            id_color,
            stock,
            status
        }
    });

    res.json({ id: newToner.id, message: "Tóner creado correctamente" });
}));

//  Crear modelo de tóner
router.post("/toner_models", catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        throw new AppError(firstError.msg, 400);
    }

    const { name, id_brand, id_device } = req.body;

    if (!name || !id_brand || !id_device) {
        throw new AppError("Faltan datos obligatorios", 400);
    }

    const newTonerModel = await prisma.toner_models.create({
        data: {
            name,
            id_brand,
            id_device
        }
    });

    res.json({ id: newTonerModel.id, message: "Modelo de tóner creado correctamente" });
    
}));

module.exports = router;
