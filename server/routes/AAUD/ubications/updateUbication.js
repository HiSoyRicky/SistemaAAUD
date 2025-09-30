const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');
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
    const { id } = req.params;
    const { name } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError('Error de validación', 400, errors.array()));
    }

    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) return res.status(400).json({ error: 'ID inválido' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre inválido' });

    const result = await pool.query(
        'UPDATE ubications SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    res.json({ message: 'Ubicación actualizada', updated: result.rows[0] });

}));

module.exports = router;
