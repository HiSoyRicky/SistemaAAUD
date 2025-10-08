const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');
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
        throw new AppError('Todos los campos son requeridos', 400);
    }

        const result = await pool.query(`
            INSERT INTO models (name, id_brand, id_device)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [name, id_brand, id_device]);

        res.status(201).json(result.rows[0]);

}));

module.exports = router;
