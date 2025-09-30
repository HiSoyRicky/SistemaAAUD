// server/routes/devices.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');
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

    const result = await pool.query(
        'UPDATE devices SET name = $1 WHERE id = $2 RETURNING *',
        [name.trim(), id]
    );

    if (result.rowCount === 0) {
        throw new AppError('Dispositivo no encontrado', 404);
    }

    res.json({ message: 'Dispositivo actualizado correctamente', device: result.rows[0] });

}));

module.exports = router;
