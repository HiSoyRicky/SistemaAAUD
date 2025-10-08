// server/routes/AAUD/departments/updateDepartment.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const { body, validationResult } = require('express-validator');

const validateDepartment = [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('id_ubication').notEmpty().withMessage('La ubicación es requerida').isInt().withMessage('ID de ubicación inválido'),
];

//  PUT actualizar departamento
router.put('/:id', validateDepartment, catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return next(new AppError(firstError.msg, 400));
    }

    const { id } = req.params;
    const { name, id_ubication } = req.body;

    // Validación adicional
    if (!name || !id_ubication) {
        return next(new AppError('Campos requeridos', 400));
    }

    const id_departmentInt = parseInt(id, 10);
    const id_ubicationInt = parseInt(id_ubication, 10);

    if (isNaN(id_departmentInt) || isNaN(id_ubicationInt)) {
        return next(new AppError('ID inválido', 400));
    }

    try {
        // Verificar si la ubicación existe
        const ubicationCheck = await prisma.ubications.findUnique({
            where: { id: id_ubicationInt }
        });

        if (!ubicationCheck) {
            return next(new AppError('La ubicación especificada no existe', 400));
        }

        // Actualizar el departamento
        const updatedDepartment = await prisma.departments.update({
            where: { id: id_departmentInt },
            data: {
                name,
                id_ubication: id_ubicationInt
            },
            select: { id: true, name: true, id_ubication: true }
        });

        res.json({
            message: 'Departamento actualizado',
            updated: updatedDepartment
        });

    } catch (error) {
        console.error('Error actualizando departamento:', error);

        // Manejar errores específicos de Prisma
        if (error.code === 'P2025') {
            // El registro no fue encontrado
            return next(new AppError('Departamento no encontrado', 404));
        }

        if (error.code === 'P2003') {
            // Foreign key constraint failed (ubicación no existe)
            return next(new AppError('La ubicación especificada no existe', 400));
        }

        if (error.code === 'P2002') {
            // Unique constraint failed (nombre duplicado)
            return next(new AppError('Ya existe un departamento con ese nombre', 400));
        }

        // Otro error inesperado
        return next(new AppError('Error interno del servidor', 500));
    }
}));

module.exports = router;