export function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date)) return '';

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mes 0-11
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
}

export function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours(); // Hora local
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}