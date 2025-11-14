export function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';

    const d = new Date(dateString);
    if (isNaN(d)) return '';

    // Siempre UTC, sin ajuste de zona
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
}

export function formatDateTime(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d)) return '';

    // Extrae hora y minuto directamente en UTC (como está en DB)
    let hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;

    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}
