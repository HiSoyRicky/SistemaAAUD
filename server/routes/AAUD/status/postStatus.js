const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const { body, validationResult } = require('express-validator');

// Validación middleware
const validateStatus = [
    body('name').notEmpty().withMessage('El nombre del estado es requerido'),
];

// POST: Crear un nuevo estado
router.post('/', validateStatus,catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        throw new AppError(firstError.msg, 400);
    }
    
    const { name } = req.body;
    if (!name) throw new AppError('El nombre del estado es requerido', 400);

    const result = await prisma.status.create({
        data: { name }
    });

    res.json({ message: 'Estatus creado', created: result });

}));

module.exports = router;