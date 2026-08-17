// incidents.dto.js

const STATUS_TEXT = {
  1: 'Pendiente',
  2: 'Asignado a un técnico',
  3: 'Resuelto',
};

const DEFAULT_STATUS_TEXT = 'Desconocido';

const TONER_COLOR_ORDER = {
  BLACK: 1,
  CYAN: 2,
  MAGENTA: 3,
  YELLOW: 4,
  TRI_COLOR: 5,
};

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
  technician_full_name: incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null,
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
  technician_full_name: incident.users_bd_incidents_id_technicianTousers?.nombre_completo || null,
  technician_email: incident.users_bd_incidents_id_technicianTousers?.email || null,
  status: STATUS_TEXT[incident.id_status] || DEFAULT_STATUS_TEXT,
});

export const mapDeleteIncidentResponse = () => ({
  message: 'Incidencia eliminada',
});

export const mapTonerRequestOptions = (printerModels = []) => {
  const printers = printerModels
    .map((printerModel) => {
      const seenColors = new Set();

      const toners = (Array.isArray(printerModel?.toners) ? printerModel.toners : [])
        .filter((toner) => {
          const color = String(toner?.color || '')
            .trim()
            .toUpperCase();
          if (!color || seenColors.has(color)) {
            return false;
          }

          seenColors.add(color);
          return true;
        })
        .map((toner) => ({
          id_toner: toner.id,
          color: toner.color,
          toner_model: toner.toner_model || null,
        }))
        .sort((a, b) => {
          const aOrder = TONER_COLOR_ORDER[a.color] || 99;
          const bOrder = TONER_COLOR_ORDER[b.color] || 99;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return String(a.toner_model || '').localeCompare(String(b.toner_model || ''), 'es', {
            sensitivity: 'base',
          });
        });

      return {
        id_printer_model: printerModel.id,
        printer_model: printerModel.name,
        brand: printerModel.brands?.name || null,
        toners,
      };
    })
    .filter((printer) => printer.toners.length > 0)
    .sort((a, b) =>
      `${a.brand || ''} ${a.printer_model || ''}`.localeCompare(
        `${b.brand || ''} ${b.printer_model || ''}`,
        'es',
        { sensitivity: 'base' }
      )
    );

  return { printers };
};
