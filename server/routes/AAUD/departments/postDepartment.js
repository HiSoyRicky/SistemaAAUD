const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const AppError = require('../../../utils/AppError');
const catchAsync = require('../../../utils/catchAsync');
const { body, validationResult } = require('express-validator');

const validateDepartment = [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('id_ubication').notEmpty().withMessage('La ubicación es requerida'),
];

// POST crear departamento
router.post('/', validateDepartment, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        throw new AppError(firstError.msg, 400);
    }

    const { name, id_ubication } = req.body;
    if (!name || !id_ubication) {
        throw new AppError('Faltan datos requeridos', 400);
    }

    const id_ubicationInt = parseInt(id_ubication, 10);
    if (isNaN(id_ubicationInt)) {
        throw new AppError('ID de ubicación inválido', 400);
    }

    // Verifica si la ubicación existe
    const ubicationExists = await prisma.ubications.findUnique({
        where: { id: id_ubicationInt }
    });
    if (!ubicationExists) {
        throw new AppError('La ubicación especificada no existe', 404);
    }

    const result = await prisma.departments.create({
        data: {
            name,
            id_ubication: id_ubicationInt
        }
    });

    res.json({ message: 'Departamento creado', created: result });
}));

module.exports = router;