const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');
const { body, validationResult } = require('express-validator');
const AppError = require('../../../utils/AppError');

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

//  Actualizar un modelo existente
router.put('/:id', validateModel, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { name, id_brand, id_device } = req.body;

    if (!name || !name.trim()) {
        throw new AppError('El nombre es obligatorio', 400);
    }

    const model = await prisma.models.findUnique({
        where: { id: parseInt(id) }
    });

    if (!model) {
        throw new AppError('Modelo no encontrado', 404);
    }
    
    const updatedModel = await prisma.models.update({
        where: { id: parseInt(id) },
        data: {
            name: name.trim(),
            id_brand,
            id_device
        }
    });

    res.json({ message: 'Modelo actualizado correctamente', model: updatedModel });

}));

module.exports = router;
