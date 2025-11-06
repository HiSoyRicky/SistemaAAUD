// server/routes/devices.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const AppError = require('../../../utils/AppError');
const catchAsync = require('../../../utils/catchAsync');
const { body, validationResult } = require('express-validator');

// Validación de datos
const validateDevice = [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
];

// Actualizar dispositivo por id
router.put('/:id', validateDevice, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        throw new AppError('El nombre es obligatorio', 400);
    }

    const device = await prisma.devices.findUnique({
        where: { id: parseInt(id) }
    });

    if (!device) {
        throw new AppError('Dispositivo no encontrado', 404);
    }
    
    const updatedDevice = await prisma.devices.update({
        where: { id: parseInt(id) },
        data: { name: name.trim() }
    });

    res.json({ message: 'Dispositivo actualizado correctamente', device: updatedDevice });

}));

module.exports = router;