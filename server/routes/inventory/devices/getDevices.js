// server/routes/devices
const express = require('express');
const router = express.Router();
const { pool } = require('../../../db/db');
const catchAsync = require('../../../utils/catchAsync');

router.get('/', catchAsync(async (req, res) => {

    const result = await pool.query('SELECT id, name FROM devices ORDER BY name');
    res.json(result.rows);

}));

module.exports = router;