// utils/formatDate.js

export function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';

    const d = new Date(dateString);

    return d.toLocaleDateString('es-PA', {
        timeZone: 'America/Panama',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function formatDateTime(dateString) {
    if (!dateString) return '';

    const d = new Date(dateString);

    return d.toLocaleString('es-PA', {
        timeZone: 'America/Panama',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}