import { STATUS_TEXT, DEFAULT_STATUS_TEXT } from './incidents.constants.js';

export const mapIncidentListItem = (incident) => ({
  id_incident: incident.id,
  ticket_number: incident.ticket_number,
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
  technician_full_name:
    incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null
});

export const mapIncidentDetail = (incident) => ({
  id_incident: incident.id,
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
  id_technician: incident.id_technician,
  technician_full_name:
    incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null,
  technician_email:
    incident.users_bd_incidents_id_technicianTousers?.email || null,
  status: STATUS_TEXT[incident.id_status] || DEFAULT_STATUS_TEXT
});

export const mapDeleteIncidentResponse = () => ({
  message: 'Incidencia eliminada'
});
