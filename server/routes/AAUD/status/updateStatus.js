const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const { body, validationResult } = require('express-validator');

const validateStatus = [
    body('name')
        .notEmpty().withMessage('El nombre del estado es requerido')
        .isLength({ max: 100 }).withMessage('El nombre del estado no puede exceder 100 caracteres')
];

// PUT: Actualizar un estado existente
router.put('/:id', validateStatus, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        throw new AppError(firstError.msg, 400);
    }

    const statusId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(statusId)) throw new AppError('ID de estado inválido', 400);
    if (!name) throw new AppError('El nombre del estado es requerido', 400);

    const result = await prisma.status.update({
        where: { id: statusId },
        data: { name },
        select: { id: true, name: true }
    });

    if (result.rows.length === 0) throw new AppError('Estado no encontrado', 404);

    res.json({ message: 'Estado actualizado', updated: result.rows[0] });

}));

module.exports = router;