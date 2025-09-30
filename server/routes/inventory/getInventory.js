// server/routes/inventory/getInventory.js
const express = require('express');
const { prisma } = require('../../Prisma');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');

router.get('/', catchAsync(async (req, res) => {
    const { search } = req.query;

        const inventory = await prisma.bd_inventory.findMany({
            where: search
                ? {
                    OR: [
                        { serie: { contains: search, mode: 'insensitive' } },
                        { tag: { contains: search, mode: 'insensitive' } },
                        { user: { contains: search, mode: 'insensitive' } },
                        { devices: { name: { contains: search, mode: 'insensitive' } } },
                        { brands: { name: { contains: search, mode: 'insensitive' } } },
                        { models: { name: { contains: search, mode: 'insensitive' } } },
                        { departments: { name: { contains: search, mode: 'insensitive' } } },
                        { ubications: { name: { contains: search, mode: 'insensitive' } } },
                    ],
                }
                : {},
            include: {
                devices: { select: { id: true, name: true } },
                brands: { select: { id: true, name: true } },
                models: { select: { id: true, name: true } },
                departments: { select: { id: true, name: true } },
                ubications: { select: { id: true, name: true } },
                status: { select: { id: true, name: true } },
            },
        });

        // Mapear relaciones al formato que tu frontend espera
        const formattedInventory = inventory.map(item => ({
            id: item.id,
            tag: item.tag,
            user: item.user,
            serie: item.serie,
            ip: item.ip,
            transferdate: item.transferdate,
            observation: item.observation,
            id_ubication: item.id_ubication,
            ubication_name: item.ubications?.name || null,
            id_department: item.id_department,
            department_name: item.departments?.name || null,
            id_device: item.id_device,
            device_name: item.devices?.name || null,
            id_brand: item.id_brand,
            brand_name: item.brands?.name || null,
            id_model: item.id_model,
            model_name: item.models?.name || null,
            id_status: item.id_status,
            status_name: item.status?.name || null,
        }));

        res.json(formattedInventory);

}));

module.exports = router;
