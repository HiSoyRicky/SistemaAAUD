import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

async function exportToExcel({ sheetName, columns, rows, fileName }) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;

    worksheet.addRows(rows);

    worksheet.addTable({
        name: `${sheetName}Table`,
        ref: 'A1',
        headerRow: true,
        style: {
            theme: 'TableStyleMedium9',
            showRowStripes: true,
        },
        columns: columns.map(c => ({ name: c.header })),
        rows: rows.map(r => columns.map(c => r[c.key])),
    });

    // Estilos globales
    worksheet.getRow(1).alignment = {
        vertical: 'middle',
        horizontal: 'center',
    };

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber !== 1) {
            row.alignment = {
                vertical: 'middle',
                horizontal: 'left',
                wrapText: true,
            };
        }
    });

    // Exportar
    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
        new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        fileName
    );
}

function formatDateTime(value) {
    if (!value) return 'N/A';

    const date = new Date(value);

    return date.toLocaleString('es-PA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export function mapTonerMovementToRow(movement) {
    const movementLabels = {
        IN: 'Entrada',
        OUT: 'Salida',
        ADJUSTMENT: 'Ajuste',
    };

    return {
        fecha: formatDateTime(movement.created_at),
        toner: movement.toner?.toner_model || 'N/A',
        tipo: movementLabels[movement.movement_type] || movement.movement_type || 'N/A',
        cantidad: movement.quantity ?? 'N/A',
        ubicacion: movement.ubication?.name || 'N/A',
        departamento: movement.department?.name || 'N/A',
        nota: movement.reference || 'N/A',
        stock_anterior: movement.previous_stock ?? 'N/A',
        stock_nuevo: movement.new_stock ?? 'N/A',
        entrego: movement.user?.nombre_completo || 'N/A',
        retiro: movement.receiver_name || 'N/A',
    };
}

// incidentExcelMapper.js
export function mapIncidentToRow(i) {
    return {
        id: i.id_incident?.toString().padStart(6, '0') || '',
        usuario: i.reporter_name || `Usuario ID: ${i.id_user}`,
        correo: i.reporter_email || 'N/A',
        ubicacion: i.ubication_name || 'N/A',
        departamento: i.department_name || 'N/A',

        // 🔥 usa nombres desde backend (no hardcode)
        categoria: i.category_name || 'N/A',
        detalle_categoria: i.other_category_detail || 'N/A',

        descripcion: i.description || '',

        // 👇 usar Date real (NO string)
        dia_creacion: new Date(i.creation_date),

        estado: i.status_name || 'N/A',
        tecnico:
            i.technician_full_name ||
            (i.id_technician ? `ID: ${i.id_technician}` : 'N/A'),

        fecha_solucion: i.solution_date
            ? new Date(i.solution_date)
            : null,

        solucion: i.solution || 'N/A',
    };
}

// inventoryExcelMapper.js
export function mapInventoryToRow(item) {
    return {
        id: item.id,
        tag: item.tag || 'N/A',
        ubication: item.ubication_name || 'N/A',
        departamento: item.department_name || 'N/A',
        usuario: item.user || 'N/A',
        device: item.device_name || 'N/A',
        marca: item.brand_name || 'N/A',
        modelo: item.model_name || 'N/A',
        serie: item.serie || 'S/S',
        ip: item.ip || 'N/A',
        estado: item.status_name || 'N/A',
        fecha_traslado: item.transferdate
            ? new Date(item.transferdate)
            : null,
        observacion: item.observation || '',
    };
}

export async function exportIncidentsToExcel(incidents) {
    const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Usuario', key: 'usuario', width: 25 },
        { header: 'Correo', key: 'correo', width: 25 },
        { header: 'Ubicación', key: 'ubicacion', width: 20 },
        { header: 'Departamento', key: 'departamento', width: 20 },
        { header: 'Categoría', key: 'categoria', width: 25 },
        { header: 'Detalle', key: 'detalle_categoria', width: 30 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Día de creación', key: 'dia_creacion', width: 18 },
        { header: 'Estado', key: 'estado', width: 14 },
        { header: 'Técnico', key: 'tecnico', width: 25 },
        { header: 'Fecha solución', key: 'fecha_solucion', width: 18 },
        { header: 'Solución', key: 'solucion', width: 40 },
    ];

    const rows = incidents.map(mapIncidentToRow);

    const fileName = `Incidencias-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

    await exportToExcel({
        sheetName: 'Incidencias',
        columns,
        rows,
        fileName,
    });
}

export async function exportInventoryToExcel(devices) {
    const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Marbete', key: 'tag', width: 14 },
        { header: 'Ubicación', key: 'ubication', width: 20 },
        { header: 'Departamento', key: 'departamento', width: 25 },
        { header: 'Usuario', key: 'usuario', width: 30 },
        { header: 'Dispositivo', key: 'device', width: 22 },
        { header: 'Marca', key: 'marca', width: 18 },
        { header: 'Modelo', key: 'modelo', width: 30 },
        { header: 'Serie', key: 'serie', width: 32 },
        { header: 'IP', key: 'ip', width: 15 },
        { header: 'Estado', key: 'estado', width: 18 },
        { header: 'Fecha traslado', key: 'fecha_traslado', width: 18 },
        { header: 'Observación', key: 'observacion', width: 36 },
    ];

    const rows = devices.map(mapInventoryToRow);

    const fileName = `Inventario-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

    await exportToExcel({
        sheetName: 'Inventario',
        columns,
        rows,
        fileName,
    });
}

export async function exportTonerMovementsToExcel(movements) {
    const columns = [
        { header: 'Fecha', key: 'fecha', width: 22 },
        { header: 'Tóner', key: 'toner', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 14 },
        { header: 'Cantidad', key: 'cantidad', width: 12 },
        { header: 'Ubicación', key: 'ubicacion', width: 22 },
        { header: 'Departamento', key: 'departamento', width: 24 },
        { header: 'Nota', key: 'nota', width: 34 },
        { header: 'Stock anterior', key: 'stock_anterior', width: 16 },
        { header: 'Stock nuevo', key: 'stock_nuevo', width: 16 },
        { header: 'Entregó', key: 'entrego', width: 26 },
        { header: 'Retiró', key: 'retiro', width: 26 },
    ];

    const rows = movements.map(mapTonerMovementToRow);

    const fileName = `Movimientos-Toner-${new Date().toISOString().slice(0, 10)}.xlsx`;

    await exportToExcel({
        sheetName: 'Movimientos Toner',
        columns,
        rows,
        fileName,
    });
}