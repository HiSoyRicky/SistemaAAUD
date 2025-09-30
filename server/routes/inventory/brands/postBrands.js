const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { body, validationResult } = require("express-validator");

const validateBrand = [
    body("name").notEmpty().withMessage("El nombre es requerido"),
];

// POST nueva marca
router.post("/", validateBrand, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name } = req.body;

    if (!name) {
        throw new AppError("Faltan datos requeridos", 400);
    }

    try {
        // Verificar si la marca ya existe (para manejo de errores específicos)
        const existingBrand = await prisma.brands.findFirst({
            where: { name: name.trim() }
        });

        if (existingBrand) {
            throw new AppError('La marca ya existe', 409);
        }

        // Crear la nueva marca
        const newBrand = await prisma.brands.create({
            data: {
                name: name.trim()
            }
        });

        res.status(201).json({
            success: true,
            message: 'Marca creada exitosamente',
            brand: newBrand
        });

    } catch (error) {
        // Manejo específico de errores
        if (error.code === 'P2002') { // Prisma unique constraint violation
            throw new AppError('La marca ya existe', 409);
        }

        // Lanza un error genérico si no es un error específico
        throw new AppError('Error al agregar marca', 500);
    }
}));

module.exports = router;