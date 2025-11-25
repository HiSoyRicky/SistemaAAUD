// postUser.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const AppError = require("../../utils/AppError");
const catchAsync = require("../../utils/catchAsync");
const bcrypt = require('bcrypt');
const { body, validationResult } = require("express-validator");

const validateUser = [
    body("username").notEmpty().withMessage("El nombre de usuario es requerido"),
    body("password").notEmpty().withMessage("La contraseña es requerida"),
    body("email").isEmail().withMessage("El correo electrónico no es válido"),
    body("password").notEmpty().withMessage("La contraseña es requerida"),
    body("id_rol").notEmpty().withMessage("El rol es requerido"),
];

// Crear un nuevo usuario
router.post('/', validateUser, catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    // Extraer datos
    let { nombre_completo, username, password, email, id_rol, active } = req.body;

    id_rol = parseInt(id_rol);
    active = active ?? 1;

    const existingUser = await prisma.users.findFirst({
        where: { username }
    });

    if (existingUser) {
        return next(new AppError('El nombre de usuario ya existe', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
        data: {
            username,
            nombre_completo,
            password: hashedPassword,
            email,
            id_rol,
            active
        }
    });

    res.json({ id: newUser.id, message: "Usuario creado correctamente" });

}));

module.exports = router;
