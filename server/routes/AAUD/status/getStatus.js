// getStatus.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

router.get('/', catchAsync(async (req, res) => {

    const status = await prisma.status.findMany({
        select: {
            id: true,
            name: true
        },
        orderBy: {
            name: 'asc'
        }
    });
    res.json(status);
}));

module.exports = router;