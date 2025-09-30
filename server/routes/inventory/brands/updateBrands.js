// updateBrands.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { body, validationResult } = require("express-validator");

const validateBrand = [
    body("name").notEmpty().withMessage("El nombre es requerido"),
];

// PUT actualizar marca
router.put("/:id", validateBrand, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(id)) throw new AppError("ID inválido", 400);
    if (!name) throw new AppError("Nombre es requerido", 400);

    // Verificar si la marca existe
    const existingBrand = await prisma.brands.findUnique({
        where: { id: parseInt(id) }
    });

    if (!existingBrand) {
        throw new AppError('Marca no encontrada', 404);
    }

    // Verificar si el nuevo nombre ya existe (excepto para la marca actual)
    const duplicateBrand = await prisma.brands.findFirst({
        where: {
            name: name.trim(),
            id: { not: parseInt(id) } // Excluir la marca actual
        }
    });

    if (duplicateBrand) {
        throw new AppError('Ya existe una marca con este nombre', 409);
    }

    // Actualizar la marca
    const updatedBrand = await prisma.brands.update({
        where: { id: parseInt(id) },
        data: {
            name: name.trim()
        }
    });

    res.json({
        success: true,
        message: 'Marca actualizada exitosamente',
        brand: updatedBrand
    });

}));

module.exports = router;