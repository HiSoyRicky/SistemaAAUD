// getUsers.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const catchAsync = require('../../utils/catchAsync');
const authMiddleware = require('../../middleware/authMiddleware');
const onlyConsultor = require('../../middleware/onlyConsultor');

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

// Buscar usuarios (autocomplete) - SOLO Consultor
router.get(
    '/search',
    authMiddleware,
    onlyConsultor,
    catchAsync(async (req, res) => {
        const q = (req.query.q || '').trim();
        if (q.length < 2) return res.json([]);

        const users = await prisma.users.findMany({
            where: {
                active: 1,
                email: { not: null },
                OR: [
                    { email: { contains: q, mode: 'insensitive' } },
                    { nombre_completo: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                nombre_completo: true,
                email: true,
            },
            orderBy: { nombre_completo: 'asc' },
            take: 15,
        });

        res.json(users.filter(u => u.email && u.email.trim() !== ''));
    })
);

module.exports = router;