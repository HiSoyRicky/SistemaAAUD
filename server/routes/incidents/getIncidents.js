const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');
const catchAsync = require('../../utils/catchAsync');

// Endpoint para obtener todas las incidencias
router.get('/', catchAsync(async (req, res) => {
    const incidents = await prisma.bd_incidents.findMany({
        select: {
            id: true,
            id_user: true,
            reporter_name: true,
            email: true,
            description: true,
            id_category: true,
            other_category_detail: true,
            id_status: true,
            creation_date: true,
            solution_date: true,
            solution: true,
            id_technician: true,
            // Relaciones
            ubications: {
                select: {
                    name: true
                }
            },
            departments: {
                select: {
                    name: true
                }
            },
            users_bd_incidents_id_technicianTousers: {
                select: {
                    nombre_completo: true
                }
            }
        }
    });

    // Mapear los resultados para que coincidan con el formato original
    const mappedIncidents = incidents.map(incident => ({
        id_incident: incident.id,
        id_user: incident.id_user,
        reporter_name: incident.reporter_name,
        reporter_email: incident.email,
        ubication_name: incident.ubications?.name || null,
        department_name: incident.departments?.name || null,
        description: incident.description,
        id_category: incident.id_category,
        other_category_detail: incident.other_category_detail,
        id_status: incident.id_status,
        creation_date: incident.creation_date,
        solution_date: incident.solution_date,
        solution: incident.solution,
        id_technician: incident.id_technician,
        technician_full_name: incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null
    }));

    res.json(mappedIncidents);
}));

// Endpoint para obtener incidencia por id
router.get('/:id', catchAsync(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const incident = await prisma.bd_incidents.findUnique({
        where: { id },
        select: {
            id: true,
            reporter_name: true,
            email: true,
            description: true,
            other_category_detail: true,
            creation_date: true,
            solution: true,
            solution_date: true,
            id_status: true,
            // Relaciones
            ubications: {
                select: {
                    name: true
                }
            },
            departments: {
                select: {
                    name: true
                }
            },
            categories: {
                select: {
                    name: true
                }
            }
        }
    });

    if (!incident) {
        return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    // Mapear el resultado al formato original
    const mappedIncident = {
        id_incident: incident.id,
        reporter_name: incident.reporter_name,
        reporter_email: incident.email,
        ubication_name: incident.ubications?.name || null,
        department_name: incident.departments?.name || null,
        category_name: incident.categories?.name || null,
        description: incident.description,
        other_category_detail: incident.other_category_detail,
        creation_date: incident.creation_date,
        solution: incident.solution,
        solution_date: incident.solution_date,
        id_status: incident.id_status,
        status: getStatusText(incident.id_status)
    };

    res.json(mappedIncident);
}));

function getStatusText(id_status) {
    switch (id_status) {
        case 1: return 'Pendiente';
        case 2: return 'Asignado a un técnico';
        case 3: return 'Resuelto';
        default: return 'Desconocido';
    }
}

module.exports = router;