// server/routes/brands
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const model = await prisma.models.findUnique({ where: { id: parseInt(id) } });

    if (!model) {
        return res.status(404).json({ message: 'Modelo no encontrado' });
    }

    await prisma.models.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Modelo eliminado correctamente' });
}));

module.exports = router;