// getBrands.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

router.get('/', catchAsync(async (req, res) => {

    const brands = await prisma.brands.findMany({
        select: {
            id: true,
            name: true
        },
        orderBy: {
            name: 'asc'
        }
    });
    res.json(brands);
}));

module.exports = router;