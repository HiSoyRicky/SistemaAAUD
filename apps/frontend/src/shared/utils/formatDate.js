// formatDate.js

const DATE_TIMEZONE = 'America/Panama';
const DATE_LOCALE = 'es-US';

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWithOptions(value, options = {}, fallback = '-') {
  const date = asDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: DATE_TIMEZONE,
    ...options,
  }).format(date);
}

// Mantiene el nombre por compatibilidad con llamadas existentes.
export function formatDateToDDMMYYYY(dateString, fallback = '-') {
  return formatWithOptions(
    dateString,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
    fallback
  );
}

export function formatDateTime(dateString, fallback = '-') {
  return formatWithOptions(
    dateString,
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    },
    fallback
  );
}

export function formatDateWithWeekday(dateString, fallback = '-') {
  return formatWithOptions(
    dateString,
    {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
    fallback
  );
}

export function formatTime(dateString, fallback = '-') {
  return formatWithOptions(
    dateString,
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    },
    fallback
  );
}

export function formatDateTimeParts(dateString, fallback = '-') {
  const date = asDate(dateString);

  if (!date) {
    return {
      date: fallback,
      time: fallback,
    };
  }

  const now = new Date();

  // Hoy
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  // Ayer
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  return {
    date: isToday
      ? 'Hoy'
      : isYesterday
        ? 'Ayer'
        : formatWithOptions(date, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),

    time: formatWithOptions(date, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
}
