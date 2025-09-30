// getDepartments.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../../Prisma');
const catchAsync = require('../../../utils/catchAsync');

router.get('/', catchAsync(async (req, res) => {

    const departments = await prisma.departments.findMany({
        select: {
            id: true,
            name: true,
            id_ubication: true,
            ubications: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            id: 'asc'
        }
    });

    const mappedDepartments = departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        id_ubication: dept.id_ubication,
        ubication_name: dept.ubications?.name || null
    }));

    res.json(mappedDepartments);

}));

module.exports = router;