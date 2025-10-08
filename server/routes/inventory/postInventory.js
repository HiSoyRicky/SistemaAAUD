// postInventory.js
const express = require('express');
const { prisma } = require('../../Prisma');
const router = express.Router();
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');
const { body, validationResult } = require('express-validator');

const validateInventory = [
    body('tag').notEmpty().withMessage('El campo tag es obligatorio'),
    body('id_ubication').isInt().withMessage('El campo id_ubication debe ser un número entero'),
    body('id_department').isInt().withMessage('El campo id_department debe ser un número entero'),
    body('id_device').isInt().withMessage('El campo id_device debe ser un número entero'),
    body('id_brand').isInt().withMessage('El campo id_brand debe ser un número entero'),
    body('id_model').isInt().withMessage('El campo id_model debe ser un número entero'),
    body('serie').notEmpty().withMessage('El campo serie es obligatorio'),
    body('id_status').isInt().withMessage('El campo id_status debe ser un número entero'),
    body('transferdate').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate().withMessage('El campo transferdate debe ser una fecha válida'),
];

router.post('/', validateInventory, catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('❌ Errores de validación:', errors.array());
        return res.status(400).json({ success: false, errors: errors.array() });
    }

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

    // Validar campos obligatorios
    if (!tag || !id_ubication || !id_department || !id_device || !id_brand || !id_model || !serie || !id_status) {
        throw new AppError('Faltan campos obligatorios', 400);
    }

    // Convertir IDs a números
    const idUbication = parseInt(id_ubication, 10);
    const idDepartment = parseInt(id_department, 10);
    const idDevice = parseInt(id_device, 10);
    const idBrand = parseInt(id_brand, 10);
    const idModel = parseInt(id_model, 10);
    const idStatus = parseInt(id_status, 10);

    // Validar que los IDs sean números válidos
    if (isNaN(idUbication) || isNaN(idDepartment) || isNaN(idDevice) || isNaN(idBrand) || isNaN(idModel) || isNaN(idStatus)) {
        throw new AppError('Los IDs deben ser números enteros válidos', 400);
    }

    try {
        // Verificar que las FKs existan
        const [
            ubicationExists,
            departmentExists,
            deviceExists,
            brandExists,
            modelExists,
            statusExists
        ] = await Promise.all([
            prisma.ubications.findUnique({ where: { id: idUbication } }),
            prisma.departments.findUnique({ where: { id: idDepartment } }),
            prisma.devices.findUnique({ where: { id: idDevice } }),
            prisma.brands.findUnique({ where: { id: idBrand } }),
            prisma.models.findUnique({ where: { id: idModel } }),
            prisma.status.findUnique({ where: { id: idStatus } })
        ]);

        if (!ubicationExists) throw new AppError('La ubicación especificada no existe', 400);
        if (!departmentExists) throw new AppError('El departamento especificado no existe', 400);
        if (!deviceExists) throw new AppError('El dispositivo especificado no existe', 400);
        if (!brandExists) throw new AppError('La marca especificada no existe', 400);
        if (!modelExists) throw new AppError('El modelo especificado no existe', 400);
        if (!statusExists) throw new AppError('El estado especificado no existe', 400);

        let transferDateObj = null;
        if (transferdate) {
            if (transferdate instanceof Date && !isNaN(transferdate.getTime())) {
                transferDateObj = transferdate;
            } else {
                throw new AppError('El campo transferdate debe ser una fecha válida', 400);
            }
        }

        const newInventory = await prisma.bd_inventory.create({
            data: {
                tag,
                id_ubication: idUbication,
                id_department: idDepartment,
                user: user || null,
                id_device: idDevice,
                id_brand: idBrand,
                id_model: idModel,
                serie,
                ip: ip || null,
                id_status: idStatus,
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

    } catch (error) {
        console.log('💥 Error detallado:', error);
        console.log('💥 Error code:', error.code);

        // Manejo específico de errores de Prisma
        if (error.code === 'P2003') {
            throw new AppError('ID de referencia inválido (FK no existe)', 400);
        }

        if (error.code === 'P2002') {
            throw new AppError('Ya existe un dispositivo con ese tag o serie', 409);
        }

        if (error.code === 'P2004') {
            throw new AppError('Error de restricción en la base de datos', 400);
        }

        if (error.code === 'P2011') {
            throw new AppError('Error: campo requerido no puede ser nulo', 400);
        }

        // Lanza un error genérico si no es un error específico
        throw new AppError('Error al crear dispositivo', 500);
    }
}));

module.exports = router;