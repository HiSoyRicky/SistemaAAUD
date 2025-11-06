// server/routes/departamentos.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

// Obtener todas las ubicaciones
router.get('/', catchAsync(async (req, res, next) => {

    const result = await prisma.ubications.findMany({
        select: {
            id: true,
            name: true
        },
        orderBy: { name: 'asc' }
    });
    res.json(result);
}));

module.exports = router;
