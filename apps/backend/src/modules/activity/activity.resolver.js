import { prisma } from '../../config/prisma.js';

// Cache en memoria simple — estas tablas no cambian frecuente
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minuto

async function getResolutionTables() {
    const now = Date.now();
    if (_cache && now - _cacheTime < CACHE_TTL) return _cache;

    const [statuses, departments, ubications, users, categories, devices, brands] =
        await Promise.all([
            prisma.status.findMany({ select: { id: true, name: true } }),
            prisma.departments.findMany({ select: { id: true, name: true } }),
            prisma.ubications.findMany({ select: { id: true, name: true } }),
            prisma.users.findMany({ select: { id: true, nombre_completo: true } }),
            prisma.categories.findMany({ select: { id: true, name: true } }),
            prisma.devices.findMany({ select: { id: true, name: true } }),
            prisma.brands.findMany({ select: { id: true, name: true } }),
        ]);

    _cache = {
        id_status: Object.fromEntries(statuses.map(r => [r.id, r.name])),
        id_department: Object.fromEntries(departments.map(r => [r.id, r.name])),
        id_ubication: Object.fromEntries(ubications.map(r => [r.id, r.name])),
        id_user: Object.fromEntries(users.map(r => [r.id, r.nombre_completo])),
        id_technician: Object.fromEntries(users.map(r => [r.id, r.nombre_completo])),
        id_category: Object.fromEntries(categories.map(r => [r.id, r.name])),
        id_device: Object.fromEntries(devices.map(r => [r.id, r.name])),
        id_brand: Object.fromEntries(brands.map(r => [r.id, r.name])),
    };
    _cacheTime = now;
    return _cache;
}

const FIELD_LABELS = {
    id_status: 'Estado',
    id_department: 'Departamento',
    id_ubication: 'Ubicación',
    id_technician: 'Técnico',
    id_user: 'Usuario',
    id_category: 'Categoría',
    id_device: 'Tipo de equipo',
    id_brand: 'Marca',
    solution: 'Solución',
    solution_date: 'Fecha de solución',
    description: 'Descripción',
    observation: 'Observación',
    user: 'Asignado a',
    tag: 'Etiqueta',
    ip: 'IP',
    reporter_name: 'Reportado por',
    serie: 'Serie',
    email: 'Email',
};

// Campos que nunca deben mostrarse en el diff
const IGNORED_FIELDS = new Set([
    'client_ip', 'created_at', 'updated_at', 'created_by', 'updated_by',
    'ticket_number', 'creation_date',
]);

export async function buildDiff(oldValues, newValues, action) {
    if (action === 'CREATE' || action === 'DELETE' || !oldValues || !newValues) {
        return null;
    }

    const tables = await getResolutionTables();
    const changes = [];

    for (const key of Object.keys(newValues)) {
        if (IGNORED_FIELDS.has(key)) continue;

        const oldRaw = oldValues[key];
        const newRaw = newValues[key];

        if (oldRaw === newRaw) continue;
        // Evita falsos positivos en null vs undefined
        if (oldRaw == null && newRaw == null) continue;

        const resolver = tables[key];
        const oldLabel = resolver
            ? (resolver[oldRaw] ?? `ID:${oldRaw}`)
            : (oldRaw ?? '—');
        const newLabel = resolver
            ? (resolver[newRaw] ?? `ID:${newRaw}`)
            : (newRaw ?? '—');

        changes.push({
            field: FIELD_LABELS[key] || key,
            from: String(oldLabel),
            to: String(newLabel),
        });
    }

    return changes.length > 0 ? changes : null;
}