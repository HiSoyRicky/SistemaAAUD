// updateUser.js
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
    body("id_rol").optional().notEmpty().withMessage("El rol no puede estar vacío"),
];

// Actualizar un usuario
router.put('/:id', validateUserUpdate, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
    }

    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        throw new AppError('ID de usuario inválido', 400);
    }

    console.log(" BODY RECIBIDO EN /usuarios/:id =>", req.body);

    const { username, id_rol, nombre_completo, email, active, id_ubication, id_department } = req.body;

    // Armamos el objeto de actualización SOLO con lo que venga
    const dataToUpdate = {};

    if (username !== undefined) dataToUpdate.username = username;
    if (nombre_completo !== undefined) dataToUpdate.nombre_completo = nombre_completo;
    if (id_rol !== undefined) dataToUpdate.id_rol = Number(id_rol);
    if (email !== undefined) dataToUpdate.email = email;
    if (id_ubication !== undefined) {
        dataToUpdate.id_ubication =
            id_ubication === null || id_ubication === "" ? null : Number(id_ubication);
    }

    if (id_department !== undefined) {
        dataToUpdate.id_department =
            id_department === null || id_department === "" ? null : Number(id_department);
    }

    if (active !== undefined) {
        dataToUpdate.active = Number(active);
    }

    console.log(" DATA QUE SE MANDA A PRISMA =>", dataToUpdate);

    const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: dataToUpdate
    });

    console.log(" USUARIO ACTUALIZADO =>", updatedUser);

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
