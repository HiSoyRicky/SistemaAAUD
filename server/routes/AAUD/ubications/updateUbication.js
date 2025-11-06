const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const AppError = require('../../../utils/AppError');
const catchAsync = require('../../../utils/catchAsync');
const { body, validationResult } = require('express-validator');

const validateUbication = [
    body('name')
        .notEmpty().withMessage('El nombre de la ubicación es requerido')
        .isLength({ max: 100 }).withMessage('El nombre de la ubicación no puede exceder 100 caracteres')
];

// PUT actualizar ubicación
router.put('/:id', validateUbication, catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError('Error de validación', 400, errors.array()));
    }

    const { id } = req.params;
    const { name } = req.body;

    // Verificar si la ubicación existe
    const existingUbication = await prisma.ubication.findUnique({
        where: { id: parseInt(id) }
    });

    if (!existingUbication) {
        return next(new AppError('Ubicación no encontrada', 404));
    }

    // Actualizar la ubicación
    const updatedUbication = await prisma.ubication.update({
        where: { id: parseInt(id) },
        data: { name }
    });

    res.status(200).json(updatedUbication);

}));

module.exports = router;
