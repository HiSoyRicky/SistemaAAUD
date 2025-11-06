// server/routes/usuarios/postUser.js
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
    body("id_rol").notEmpty().withMessage("El rol es requerido"),
];

// Crear un nuevo usuario
router.post('/', validateUser, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return AppError(errors.array()[0].msg, 400);
    }

    const { username, password, email, id_rol } = req.body;

    const existingUser = await prisma.users.findUnique({
        where: { username }
    });

    if (existingUser) {
        return AppError('El nombre de usuario ya existe', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
        data: {
            username,
            password: hashedPassword,
            email,
            id_rol
        }
    });

    res.json({ id: newUser.id, message: "Usuario creado correctamente" });
    
}));

module.exports = router;
