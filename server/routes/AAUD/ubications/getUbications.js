// server/routes/departamentos.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');
const catchAsync = require('../../../utils/catchAsync');

router.get('/', catchAsync(async (req, res, next) => {

    const result = await pool.query(`
        SELECT id, name
        FROM ubications
            ORDER BY name
    `);
    res.json(result.rows);
}));

module.exports = router;
