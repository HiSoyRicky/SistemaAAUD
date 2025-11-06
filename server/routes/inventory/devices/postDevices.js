const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const AppError = require('../../../utils/AppError');
const catchAsync = require('../../../utils/catchAsync');
const { body, validationResult } = require('express-validator');

const validateDevice = [
    body('name').notEmpty().withMessage('El nombre es requerido'),
];

router.post('/', validateDevice, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name } = req.body;
    if (!name) {
        throw new AppError('Faltan datos requeridos', 400);
    }

    try {
        const existingDevice = await prisma.devices.findFirst({
            where: { name: name.trim() }
        });

        if (existingDevice) {
            throw new AppError('El dispositivo ya existe', 409);
        }

        const newDevice = await prisma.devices.create({
            data: {
                name: name.trim()
            }
        });

        res.status(201).json({
            success: true,
            message: 'Dispositivo creado exitosamente',
            device: newDevice
        });

    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'El dispositivo ya existe',
            });
        }

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Error al agregar dispositivo:", error);
        return res.status(500).json({
            success: false,
            message: 'Error al agregar dispositivo',
        });
    }


}));

module.exports = router;