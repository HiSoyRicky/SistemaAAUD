// incidentUpdateEmailTemplate.js

function formatPanamaDate(date) {
  if (!date) {
    return 'N/A';
  }

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('es-PA', {
    timeZone: 'America/Panama',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

function buildAssignmentIncidentEmail({
  incident,
  formattedTicket,
  privateViewUrl,
  technicianName,
}) {
  return `
        <div style="
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9f9f9;
            padding: 20px;
        ">
            <div style="
                max-width: 600px;
                margin: auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-top: 6px solid #2563eb;
            ">
                <h2 style="
                    color: #111827;
                    text-align: center;
                    margin-bottom: 20px;
                ">Incidencia Asignada</h2>

                <p style="font-size: 16px; color: #374151;">
                    Hola ${technicianName}, se te ha asignado una nueva incidencia:
                </p>

                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                        <td style="padding: 8px;">${formattedTicket}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                        <td style="padding: 8px;">${incident.reporter_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                        <td style="padding: 8px;">${incident.ubications?.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                        <td style="padding: 8px;">${incident.departments?.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                        <td style="padding: 8px;">${incident.categories?.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                        <td style="padding: 8px;">${incident.other_category_detail || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                        <td style="padding: 8px;">${incident.description}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                        <td style="padding: 8px;">${formatPanamaDate(incident.creation_date)}</td>
                    </tr>
                </table>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${privateViewUrl}" style="
                        display: inline-block;
                        padding: 12px 25px;
                        background-color: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        transition: background-color 0.3s ease;
                    " onmouseover="this.style.backgroundColor='#1e40af'" onmouseout="this.style.backgroundColor='#2563eb'">
                        Ver incidencia
                    </a>
                </div>

                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                    Por favor, no responda a este correo. Este buzón no es supervisado.<br/>
                    Para cualquier consulta, utilice el sistema de incidencias.<br/>
                    Gracias.
                </p>
            </div>
        </div>
    `;
}

function buildResolvedIncidentEmail({ incident, formattedTicket, publicViewUrl, reporterName }) {
  return `
        <div style="
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9f9f9;
            padding: 20px;
        ">
            <div style="
                max-width: 600px;
                margin: auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-top: 6px solid #2563eb;
            ">
                <h2 style="
                    color: #111827;
                    text-align: center;
                    margin-bottom: 20px;
                ">Incidencia Resuelta</h2>

                <p style="font-size: 16px; color: #374151;">
                    Hola ${reporterName}, tu incidencia ha sido resuelta:
                </p>

                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Incidencia N°:</td>
                        <td style="padding: 8px;">${formattedTicket}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Reportado por:</td>
                        <td style="padding: 8px;">${incident.reporter_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Ubicación:</td>
                        <td style="padding: 8px;">${incident.ubications?.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Departamento:</td>
                        <td style="padding: 8px;">${incident.departments?.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Categoría:</td>
                        <td style="padding: 8px;">${incident.categories?.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Otra categoría:</td>
                        <td style="padding: 8px;">${incident.other_category_detail || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Descripción:</td>
                        <td style="padding: 8px;">${incident.description}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Fecha de creación:</td>
                        <td style="padding: 8px;">${formatPanamaDate(incident.creation_date)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Solución:</td>
                        <td style="padding: 8px;">${incident.solution}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Fecha de solución:</td>
                        <td style="padding: 8px;">${formatPanamaDate(incident.solution_date)}</td>
                    </tr>
                </table>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${publicViewUrl}" style="
                        display: inline-block;
                        padding: 12px 25px;
                        background-color: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: bold;
                        transition: background-color 0.3s ease;
                    " onmouseover="this.style.backgroundColor='#1e40af'" onmouseout="this.style.backgroundColor='#2563eb'">
                        Ver incidencia
                    </a>
                </div>

                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                    Por favor, no responda a este correo. Este buzón no está siendo supervisado.<br/>
                    Para cualquier consulta, utilice el sistema de incidencias.<br />
                    Gracias.
                </p>
            </div>
        </div>
    `;
}

export { buildAssignmentIncidentEmail, buildResolvedIncidentEmail };
