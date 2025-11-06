const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
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

    if (!status || !status.trim()) {
        throw new AppError("El estado es obligatorio", 400);
    }

    const toner = await prisma.toners.findUnique({
        where: { id: parseInt(id) }
    });

    if (!toner) {
        throw new AppError("Toner no encontrado", 404);
    }

    const updatedToner = await prisma.toners.update({
        where: { id: parseInt(id) },
        data: { status: status.trim() }
    });

    res.json({ message: "Toner actualizado correctamente", toner: updatedToner });

}));

module.exports = router;