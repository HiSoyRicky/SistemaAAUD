const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');
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

// 🔹 Actualizar un modelo existente
router.put('/:id', validateModel, catchAsync(async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const modelId = parseInt(req.params.id, 10);
    const { name, id_brand, id_device } = req.body;

    if (isNaN(modelId)) {
        throw new AppError('ID de modelo inválido', 400);
    }

    if (!name || !id_brand || !id_device) {
        throw new AppError('Todos los campos son requeridos', 400);
    }

        const result = await pool.query(`
            UPDATE models
            SET name = $1, id_brand = $2, id_device = $3
            WHERE id = $4
            RETURNING *
        `, [name, id_brand, id_device, modelId]);

        if (result.rows.length === 0) {
            throw new AppError('Modelo no encontrado', 404);
        }

        res.json(result.rows[0]);

}));

module.exports = router;
