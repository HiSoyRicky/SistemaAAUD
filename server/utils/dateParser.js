const express = require("express");

const TZ_PANAMA = "-05:00";

// Para <input type="date">  → "YYYY-MM-DD"
function parseDateOnly(value) {
    if (!value || typeof value !== "string") return null;

    const d = new Date(`${value}T00:00:00${TZ_PANAMA}`);
    return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateTime(value) {
    if (!value) return null;

    if (typeof value === "string") {
        const hasTZ = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
        const isLocalDT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);

        // datetime-local => le pegamos TZ de Panamá
        if (isLocalDT && !hasTZ) {
            const d = new Date(`${value}:00${TZ_PANAMA}`);
            return Number.isNaN(d.getTime()) ? null : d;
        }
    }

    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { parseDateOnly, parseDateTime };
