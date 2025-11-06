const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const device = await prisma.devices.findUnique({ where: { id: parseInt(id) } });

    if (!device) {
        return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }

    await prisma.devices.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Dispositivo eliminado correctamente' });
}));

module.exports = router;