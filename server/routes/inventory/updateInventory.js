// server/routes/inventory/updateInventory.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { body, validationResult } = require('express-validator');

const validateInventoryUpdate = [
    body('tag').optional().notEmpty().withMessage('El campo tag no puede estar vacío'),
    body('id_ubication').optional().isInt().withMessage('El campo id_ubication debe ser un número entero'),
    body('id_department').optional().isInt().withMessage('El campo id_department debe ser un número entero'),
    body('id_device').optional().isInt().withMessage('El campo id_device debe ser un número entero'),
    body('id_brand').optional().isInt().withMessage('El campo id_brand debe ser un número entero'),
    body('id_model').optional().isInt().withMessage('El campo id_model debe ser un número entero'),
    body('serie').optional().notEmpty().withMessage('El campo serie no puede estar vacío'),
    body('ip').optional().isIP().withMessage('El campo ip debe ser una dirección IP válida'),
    body('id_status').optional().isInt().withMessage('El campo id_status debe ser un número entero'),
    body('transferdate').optional().isISO8601().toDate().withMessage('El campo transferdate debe ser una fecha válida'),
];

router.put('/:id', validateInventoryUpdate, catchAsync(async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { id } = req.params;
    const {
        tag,
        id_ubication,
        id_department,
        user,
        id_device,
        id_brand,
        id_model,
        serie,
        ip,
        id_status,
        transferdate,
        observation
    } = req.body;

    // Validaciones básicas
    if (isNaN(parseInt(id))) throw new AppError('ID inválido', 400);
    if (id_ubication && isNaN(parseInt(id_ubication))) throw new AppError('Ubicación inválida', 400);
    if (id_department && isNaN(parseInt(id_department))) throw new AppError('Departamento inválido', 400);
    if (id_device && isNaN(parseInt(id_device))) throw new AppError('Dispositivo inválido', 400);
    if (id_brand && isNaN(parseInt(id_brand))) throw new AppError('Marca inválida', 400);
    if (id_model && isNaN(parseInt(id_model))) throw new AppError('Modelo inválido', 400);
    if (id_status && isNaN(parseInt(id_status))) throw new AppError('Estado inválido', 400);

    if (id_ubication) {
        const ubication = await prisma.ubications.findUnique({
            where: { id: parseInt(id_ubication) }
        });
        if (!ubication)
            throw new AppError('La ubicación proporcionada no existe', 400);
    }

    if (id_department) {
        const department = await prisma.departments.findUnique({
            where: { id: parseInt(id_department) }
        });
        if (!department)
            throw new AppError('El departamento proporcionado no existe', 400);
    }

    if (id_device) {
        const device = await prisma.devices.findUnique({
            where: { id: parseInt(id_device) }
        });
        if (!device)
            throw new AppError('El dispositivo proporcionado no existe', 400);
    }

    const updateData = {};

    if (tag !== undefined) updateData.tag = tag;
    if (id_ubication !== undefined) updateData.id_ubication = parseInt(id_ubication);
    if (id_department !== undefined) updateData.id_department = parseInt(id_department);
    if (user !== undefined) updateData.user = user;
    if (id_device !== undefined) updateData.id_device = parseInt(id_device);
    if (id_brand !== undefined) updateData.id_brand = parseInt(id_brand);
    if (id_model !== undefined) updateData.id_model = parseInt(id_model);
    if (serie !== undefined) updateData.serie = serie;
    if (ip !== undefined) updateData.ip = ip;
    if (id_status !== undefined) updateData.id_status = parseInt(id_status);
    if (observation !== undefined) updateData.observation = observation;

    if (transferdate !== undefined) {
        updateData.transferdate = transferdate ? new Date(transferdate) : null;
    }

    // Actualizar el registro usando Prisma
    const updatedInventory = await prisma.bd_inventory.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
            devices: { select: { id: true, name: true } },
            brands: { select: { id: true, name: true } },
            models: { select: { id: true, name: true } },
            departments: { select: { id: true, name: true } },
            ubications: { select: { id: true, name: true } },
            status: { select: { id: true, name: true } },
        },
    });

    // Mapear para el frontend
    const formattedInventory = {
        id: updatedInventory.id,
        tag: updatedInventory.tag,
        user: updatedInventory.user,
        serie: updatedInventory.serie,
        ip: updatedInventory.ip,
        transferdate: updatedInventory.transferdate,
        observation: updatedInventory.observation,
        id_ubication: updatedInventory.id_ubication,
        ubication_name: updatedInventory.ubications?.name || null,
        id_department: updatedInventory.id_department,
        department_name: updatedInventory.departments?.name || null,
        id_device: updatedInventory.id_device,
        device_name: updatedInventory.devices?.name || null,
        id_brand: updatedInventory.id_brand,
        brand_name: updatedInventory.brands?.name || null,
        id_model: updatedInventory.id_model,
        model_name: updatedInventory.models?.name || null,
        id_status: updatedInventory.id_status,
        status_name: updatedInventory.status?.name || null,
    };

    res.json({
        success: true,
        message: 'Equipo actualizado correctamente',
        inventory: formattedInventory
    });

}));

module.exports = router;