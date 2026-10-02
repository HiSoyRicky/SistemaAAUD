import { isIP } from 'node:net';
import AppError from '../../common/utils/AppError.js';

const PRINTER_IP_MARKER = '\n\n[IP impresora (soporte): ';
const MAX_INCIDENT_DESCRIPTION_LENGTH = 255;

export function splitPrinterIpDescription(value) {
  const description = String(value || '');
  const markerIndex = description.lastIndexOf(PRINTER_IP_MARKER);
  if (markerIndex < 0 || !description.endsWith(']')) {
    return { description, printerIps: [] };
  }

  const storedIps = description
    .slice(markerIndex + PRINTER_IP_MARKER.length, -1)
    .split(',')
    .map((ip) => ip.trim());
  if (!storedIps.length || storedIps.some((ip) => isIP(ip) === 0)) {
    return { description, printerIps: [] };
  }

  return {
    description: description.slice(0, markerIndex),
    printerIps: [...new Set(storedIps)],
  };
}

export function getReporterIncidentDescription(value) {
  return splitPrinterIpDescription(value).description;
}

export function appendPrinterIpsToIncidentDescription(description, printerIps = []) {
  const cleanDescription = splitPrinterIpDescription(description).description.trimEnd();
  const uniqueIps = [...new Set(printerIps.map((ip) => String(ip || '').trim()).filter((ip) => isIP(ip)))];
  if (!uniqueIps.length) return cleanDescription;

  const result = `${cleanDescription}${PRINTER_IP_MARKER}${uniqueIps.join(', ')}]`;
  if (result.length > MAX_INCIDENT_DESCRIPTION_LENGTH) {
    throw new AppError(
      'La descripción es demasiado larga para agregar la IP de la impresora. Acorte el texto e intente nuevamente.',
      400
    );
  }

  return result;
}