// server/routes/devices
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

router.get('/', catchAsync(async (req, res) => {

    const result = await prisma.devices.findMany({
        select: {
            id: true,
            name: true
        },
        orderBy: { name: 'asc' }
    });
    res.json(result);

}));

module.exports = router;