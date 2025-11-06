const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const { body, validationResult } = require('express-validator');

const validateModel = [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('id_brand').isInt().withMessage('El id_brand debe ser un entero'),
    body('id_device').isInt().withMessage('El id_device debe ser un entero'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

//  Crear un nuevo modelo
router.post('/', validateModel, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, id_brand, id_device } = req.body;
    if (!name || !id_brand || !id_device) {
        throw new AppError('Faltan datos requeridos', 400);
    }

    try {
        const existingModel = await prisma.models.findFirst({
            where: {
                name: name.trim(),
                id_brand: id_brand,
                id_device: id_device
            }
        });

        if (existingModel) {
            throw new AppError('El modelo ya existe para esta marca y tipo de dispositivo', 409);
        }

        const newModel = await prisma.models.create({
            data: {
                name: name.trim(),
                id_brand: id_brand,
                id_device: id_device
            }
        });

        res.status(201).json({
            success: true,
            message: 'Modelo creado exitosamente',
            model: newModel
        });

    } catch (error) {
        if (error.code === 'P2002') {
            throw new AppError('El modelo ya existe para esta marca y tipo de dispositivo', 409);
        }
        throw new AppError('Error al agregar modelo', 500);
    }

}));

module.exports = router;
