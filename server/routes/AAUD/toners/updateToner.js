const express = require("express");
const router = express.Router();
const { pool } = require("../../../db/db");
const AppError = require("../../../utils/AppError");
const catchAsync = require("../../../utils/catchAsync");
const { body, validationResult } = require("express-validator");

const validateTonerUpdate = [
    body("status").notEmpty().withMessage("El estado es requerido").isString().withMessage("El estado debe ser un texto"),
];

router.put("/:id", validateTonerUpdate, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        throw new AppError(firstError.msg, 400);
    }

    const { id } = req.params;
    const { status } = req.body;

        await pool.query(`
            UPDATE toners 
            SET status = $1, last_update = NOW() 
            WHERE id = $2
        `, [status, id]);

        res.json({ message: 'Toner actualizado', updated: result.rows[0] });

}));

module.exports = router;