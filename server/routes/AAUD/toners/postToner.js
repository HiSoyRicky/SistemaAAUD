const express = require("express");
const router = express.Router();
const { pool } = require("../../../db/db");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { body, validationResult } = require("express-validator");

// 🔹 Validación middleware
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

    const { id_printer_model, id_toner_model, id_color, stock, status } = req.body;

    if (!id_printer_model || !id_toner_model || !id_color) {
        throw new AppError("Faltan datos requeridos", 400);
    }

    const result = await pool.query(
        `INSERT INTO toners (id_printer_model, id_toner_model, id_color, stock, status, last_update)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING id`,
        [id_printer_model, id_toner_model, id_color, stock || 0, status || 'Disponible']
    );
    res.json({ id: result.rows[0].id, message: "Tóner creado correctamente" });

}));

// 🔹 Crear modelo de tóner
router.post("/toner_models", catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        throw new AppError(firstError.msg, 400);
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
        throw new AppError("El nombre es requerido", 400);
    }

    const result = await pool.query(
        `INSERT INTO toner_models (name) 
             VALUES ($1) 
             RETURNING id, name`,
        [name.trim()]
    );
    res.json({ id: result.rows[0].id, message: "Modelo de toner creado correctamente" });

}));

module.exports = router;
