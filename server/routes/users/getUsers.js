// getUsers.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const catchAsync = require('../../utils/catchAsync');

// Obtener todos los usuarios
router.get('/', catchAsync(async (req, res) => {

    const users = await prisma.users.findMany({
        select: {
            id: true,
            nombre_completo: true,
            username: true,
            email: true,
            id_rol: true,
            active: true
        }
    });
    res.json(users);

}));

router.get('/technicians', catchAsync(async (req, res) => {

    const technicians = await prisma.users.findMany({
        select: {
            id: true,
            nombre_completo: true,
            username: true,
            email: true,
            id_rol: true,
            active: true
        },
        where: {
            id_rol: 2,
        }
    });
    res.json(technicians);

}));

// Obtener todos los roles
router.get('/roles', async (req, res) => {

    const roles = await prisma.roles.findMany({
        select: {
            id: true,
            name: true
        }
    });

    res.json(roles);
});

module.exports = router;