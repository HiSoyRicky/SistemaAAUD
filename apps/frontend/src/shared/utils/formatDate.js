// formatDate.js

const DATE_TIMEZONE = 'America/Panama';
const DATE_LOCALE = 'es-US';
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

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

function dateOnlyParts(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    const match = value.match(DATE_ONLY_PATTERN);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }

  const date = asDate(value);
  if (!date) return null;

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function toDateOnlyInputValue(value) {
  const parts = dateOnlyParts(value);
  if (!parts) return '';

  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateOnlyToDDMMYYYY(value, fallback = '-') {
  const inputValue = toDateOnlyInputValue(value);
  if (!inputValue) return fallback;

  return formatWithOptions(
    `${inputValue}T00:00:00Z`,
    {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
    fallback
  );
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
