// server/routes/usuarios/updateUser.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const AppError = require("../../utils/AppError");
const catchAsync = require("../../utils/catchAsync");
const bcrypt = require('bcrypt');
const { body, validationResult } = require("express-validator");

const validateUserUpdate = [
    body("username").optional().notEmpty().withMessage("El nombre de usuario no puede estar vacío"),
    body("nombre_completo").optional().notEmpty().withMessage("El nombre completo no puede estar vacío"),
    body("email").optional().isEmail().withMessage("El correo electrónico no es válido"),
    body("id_rol").optional().notEmpty().withMessage("El rol no puede estar vacío"),
];

// Actualizar un usuario
router.put('/:id', validateUserUpdate, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
    }

    const userId = parseInt(req.params.id, 10);
    const { username, email, id_rol, nombre_completo } = req.body;

    if (isNaN(userId)) {
        throw new AppError('ID de usuario inválido', 400);
    }

    const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
            username,
            nombre_completo,
            email,
            id_rol
        }
    });

    res.json({ id: updatedUser.id, message: "Usuario actualizado correctamente" });
}));


// Actualizar la contraseña de un usuario
router.put('/:id/password', catchAsync(async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (isNaN(userId)) {
        throw new AppError('ID de usuario inválido', 400);
    }

    if (!newPassword || newPassword.trim() === '') {
        throw new AppError('La nueva contraseña es requerida', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    res.json({ message: "Contraseña actualizada correctamente" });
}));

module.exports = router;
