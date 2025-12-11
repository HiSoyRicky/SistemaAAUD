import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDateToDDMMYYYY } from './formatDate';

export async function exportIncidentsToExcel(incidents) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Incidencias');

    const columns = [
        { header: 'ID', key: 'id', width: 7.5 },
        { header: 'Usuario', key: 'usuario', width: 25 },
        { header: 'Correo', key: 'correo', width: 25 },
        { header: 'Ubicación', key: 'ubicacion', width: 20 },
        { header: 'Departamento', key: 'departamento', width: 20 },
        { header: 'Categoría', key: 'categoria', width: 25 },
        { header: 'Detalle de categoría', key: 'detalle_categoria', width: 30 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Día de creación', key: 'dia_creacion', width: 16 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Técnico', key: 'tecnico', width: 25 },
        { header: 'Fecha de solución', key: 'fecha_solucion', width: 25 },
        { header: 'Solución', key: 'solucion', width: 40 },
    ];

    // Ordenar por ID descendente
    incidents.sort((a, b) => (b.id_incident || 0) - (a.id_incident || 0));

    worksheet.columns = columns;

    const rows = incidents.map((i) => {
        const fechaCreacion = i.creation_date ? new Date(i.creation_date) : null;
        const fechaCreacionStr = fechaCreacion
            ? formatDateToDDMMYYYY(fechaCreacion.toISOString())
            : 'N/A';

        return {
            id: i.id_incident ? i.id_incident.toString().padStart(6, '0') : '',
            usuario: i.reporter_name || `Usuario ID: ${i.id_user}`,
            correo: i.reporter_email || 'N/A',
            ubicacion: i.ubication_name || 'N/A',
            departamento: i.department_name || 'N/A',
            categoria: getCategoryName(i.id_category),
            detalle_categoria: i.other_category_detail || 'N/A',
            descripcion: i.description,
            dia_creacion: fechaCreacionStr,
            estado: getStatusName(i.id_status),
            tecnico: i.technician_full_name || (i.id_technician ? `ID: ${i.id_technician}` : 'N/A'),
            // 🔹 AQUÍ solo la fecha, sin hora
            fecha_solucion: i.solution_date
                ? (() => {
                    const fSol = new Date(i.solution_date);
                    const fSolStr = formatDateToDDMMYYYY(fSol.toISOString());
                    return fSolStr;          // <- sin hora
                })()
                : 'N/A',
            solucion: i.solution || 'N/A',
        };
    });

    // Agregar filas
    rows.forEach(row => worksheet.addRow(row));

    // Encabezados centrados
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Crear tabla
    worksheet.addTable({
        name: 'IncidenciasTable',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleMedium9',
            showRowStripes: true,
        },
        columns: columns.map(col => ({ name: col.header, filterButton: true })),
        rows: rows.map(r => columns.map(c => r[c.key])),
    });

    // Alineaciones (corrigiendo columnas que existen)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber !== 1) {
            row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            const descripcionCol = worksheet.getColumn('descripcion').number;
            const solucionCol = worksheet.getColumn('solucion').number;
            const colDia = worksheet.getColumn('dia_creacion').number;
            const colEstado = worksheet.getColumn('estado').number;
            const colFechaSolucion = worksheet.getColumn('fecha_solucion').number;

            row.getCell(descripcionCol).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            row.getCell(solucionCol).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            row.getCell(colDia).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            row.getCell(colEstado).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            row.getCell(colFechaSolucion).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const hoyStr = formatDateToDDMMYYYY(new Date().toISOString());
    const nombreArchivo = `incidencias.${hoyStr.replace(/\//g, '-')}.xlsx`;

    saveAs(blob, nombreArchivo);
}


// Funciones auxiliares
function getCategoryName(id) {
    switch (id) {
        case 1: return 'Problemas con el internet';
        case 2: return 'Problemas con el equipo';
        case 3: return 'Problemas con un programa';
        case 4: return 'Otro';
        default: return 'Desconocida';
    }
}

function getStatusName(id) {
    switch (id) {
        case 1: return 'Pendiente';
        case 2: return 'Asignado';
        case 3: return 'Resuelto';
        default: return 'Desconocido';
    }
}

export async function exportInventoryToExcel(devices) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    // Definir columnas
    const columns = [
        { header: 'ID', key: 'id', width: 7.5 },
        { header: 'Marbete', key: 'tag', width: 14 },
        { header: 'Ubicación', key: 'ubication', width: 20 },
        { header: 'Departamento', key: 'departamento', width: 25 },
        { header: 'Usuario', key: 'usuario', width: 32 },
        { header: 'Dispositivo', key: 'device', width: 22 },
        { header: 'Marca', key: 'marca', width: 18 },
        { header: 'Modelo', key: 'modelo', width: 30 },
        { header: 'Serie', key: 'serie', width: 32 },
        { header: 'IP', key: 'ip', width: 15 },
        { header: 'Estado', key: 'estado', width: 18 },
        { header: 'Fecha de Traslado', key: 'fecha_traslado', width: 20 },
        { header: 'Observación', key: 'observacion', width: 36 },
    ];
    worksheet.columns = columns;
    // Mapea inventario a filas
    const rows = devices.map((item) => {
        return {
            id: item.id,
            tag: item.tag || 'N/A',
            ubication: item.ubication_name || 'N/A',
            departamento: item.department_name || 'N/A',
            usuario: item.user,
            device: item.device_name || 'N/A',
            marca: item.brand_name || 'N/A',
            modelo: item.model_name || 'N/A',
            serie: item.serie || 'S/S',
            ip: item.ip,
            estado: item.status_name || 'Desconocido',
            fecha_traslado: item.transferdate
                ? formatDateToDDMMYYYY(new Date(item.transferdate).toISOString())
                : '',
            observacion: item.observation,
        };
    });

    // Agregar filas
    rows.forEach(row => worksheet.addRow(row));

    // Encabezados centrados
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Ajustes de alineación en filas
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber !== 1) {
            row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            const colTag = worksheet.getColumn('tag').number;
            const colEstado = worksheet.getColumn('estado').number;
            const colFecha = worksheet.getColumn('fecha_traslado').number;

            row.getCell(colTag).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            row.getCell(colEstado).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            row.getCell(colFecha).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
    });

    // Agregar tabla con filtros
    worksheet.addTable({
        name: 'InventarioTable',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleMedium9',
            showRowStripes: true,
        },
        columns: columns.map(col => ({ name: col.header, filterButton: true })),
        rows: rows.map(r => columns.map(c => r[c.key])),
    });

    // Descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const hoyStr = formatDateToDDMMYYYY(new Date().toISOString());
    const nombreArchivo = `inventario.${hoyStr.replace(/\//g, '-')}.xlsx`;

    saveAs(blob, nombreArchivo);
}