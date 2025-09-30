const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// DELETE eliminar departamento
router.delete('/:id', catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const id_department = parseInt(id, 10);
    if (isNaN(id_department)) {
        throw new AppError('ID inválido', 400);
    }

    try {
        const deletedDepartment = await prisma.departments.delete({
            where: { id: id_department }
        });

        res.json({ message: 'Departamento eliminado' });

    } catch (error) {
        // Si no existe, Prisma lanza un error P2025
        if (error.code === 'P2025') {
            throw new AppError('Departamento no encontrado', 404);
        }
        // Otro error inesperado
        throw error;
    }
}));

module.exports = router;
