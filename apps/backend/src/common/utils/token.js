// token.js

import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';

const secretKey = process.env.JWT_SECRET;

function generarTokenIncidencia(id, email) {
  const payload = { id, email, type: 'incident' };
  return jwt.sign(payload, secretKey, { expiresIn: '730h' }); // 30 días
}

async function getIncidentByToken(token) {
  try {
    const decoded = jwt.verify(token, secretKey);
    const { id /*, email*/ } = decoded;

    const incident = await prisma.bd_incidents.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        ticket_number: true,
        reporter_name: true,
        email: true,
        description: true,
        other_category_detail: true,
        creation_date: true,
        solution: true,
        solution_date: true,
        id_status: true,
        id_technician: true,
        ubications: { select: { name: true } },
        departments: { select: { name: true } },
        categories: { select: { name: true } },
        status: { select: { name: true } },
        users_bd_incidents_id_technicianTousers: {
          select: {
            nombre_completo: true,
            email: true,
          },
        },
      },
    });

    if (!incident) {
      console.log('Incidencia no encontrada con id:', id);
      return null;
    }

    return {
      id: incident.id,
      ticket_number: incident.ticket_number,
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
      status: incident.status?.name || null,
      id_technician: incident.id_technician,
      technician_full_name:
        incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null,
      technician_email: incident.users_bd_incidents_id_technicianTousers?.email || null,
    };
  } catch (err) {
    console.error('Error validating token:', err);
    throw err;
  }
}

export { generarTokenIncidencia, getIncidentByToken };
