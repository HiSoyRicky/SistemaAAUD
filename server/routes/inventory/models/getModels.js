// server/routes/brands
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

router.get('/', catchAsync(async (req, res) => {

    const result = await prisma.models.findMany({
        select: {
            id: true,
            name: true,
            id_brand: true,
            id_device: true
        },
        orderBy: { name: 'asc' }
    });
    res.json(result);

}));

module.exports = router;
