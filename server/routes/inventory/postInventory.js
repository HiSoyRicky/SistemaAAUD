// server/routes/inventory/postInventory.js
const express = require('express');
const { prisma } = require('../../Prisma');
const router = express.Router();

router.post('/', async (req, res) => {
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

    try {
        // Validar campos obligatorios
        if (!tag || !id_ubication || !id_department || !id_device || !id_brand || !id_model || !serie || !id_status) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        const transferDateObj = transferdate ? new Date(transferdate) : new Date();

        // Crear el registro usando Prisma
        const newInventory = await prisma.bd_inventory.create({
            data: {
                tag,
                id_ubication: parseInt(id_ubication),
                id_department: parseInt(id_department),
                user: user || null,
                id_device: parseInt(id_device),
                id_brand: parseInt(id_brand),
                id_model: parseInt(id_model),
                serie,
                ip: ip || null,
                id_status: parseInt(id_status),
                transferdate: transferDateObj,
                observation: observation || null,
            },
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
            id: newInventory.id,
            tag: newInventory.tag,
            user: newInventory.user,
            serie: newInventory.serie,
            ip: newInventory.ip,
            transferdate: newInventory.transferdate,
            observation: newInventory.observation,
            id_ubication: newInventory.id_ubication,
            ubication_name: newInventory.ubications?.name || null,
            id_department: newInventory.id_department,
            department_name: newInventory.departments?.name || null,
            id_device: newInventory.id_device,
            device_name: newInventory.devices?.name || null,
            id_brand: newInventory.id_brand,
            brand_name: newInventory.brands?.name || null,
            id_model: newInventory.id_model,
            model_name: newInventory.models?.name || null,
            id_status: newInventory.id_status,
            status_name: newInventory.status?.name || null,
        };

        res.status(201).json({
            success: true,
            message: 'Dispositivo creado exitosamente',
            inventory: formattedInventory
        });
    } catch (err) {
        console.error('❌ Error al crear dispositivo:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error al crear el dispositivo',
            error: err.message
        });
    }
});

module.exports = router;
