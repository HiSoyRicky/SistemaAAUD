// utils/formatDate.js

function parseAsLocal(dateInput) {
    if (!dateInput) return null;

    // Si ya es un Date, úsalo directo
    if (dateInput instanceof Date) return dateInput;

    if (typeof dateInput === 'string') {
        // Si viene como "2025-12-02T14:00:00.000Z", le quitamos la Z
        const cleaned = dateInput.endsWith('Z')
            ? dateInput.slice(0, -1)
            : dateInput;

        const d = new Date(cleaned);
        return isNaN(d) ? null : d;
    }

    const d = new Date(dateInput);
    return isNaN(d) ? null : d;
}

export function formatDateToDDMMYYYY(dateString) {
    const d = parseAsLocal(dateString);
    if (!d) return '';

    const day = d.toLocaleString('es-PA', { timeZone: 'America/Panama', day: '2-digit' });
    const month = d.toLocaleString('es-PA', { timeZone: 'America/Panama', month: '2-digit' });
    const year = d.toLocaleString('es-PA', { timeZone: 'America/Panama', year: 'numeric' });

    return `${day}/${month}/${year}`;
}

export function formatDateTime(dateString) {
    const d = parseAsLocal(dateString);
    if (!d) return '';

    const day = d.toLocaleString('es-PA', { timeZone: 'America/Panama', day: '2-digit' });
    const month = d.toLocaleString('es-PA', { timeZone: 'America/Panama', month: '2-digit' });
    const year = d.toLocaleString('es-PA', { timeZone: 'America/Panama', year: 'numeric' });

    const time = d.toLocaleString('es-PA', {
        timeZone: 'America/Panama',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return `${day}/${month}/${year} ${time}`;
}