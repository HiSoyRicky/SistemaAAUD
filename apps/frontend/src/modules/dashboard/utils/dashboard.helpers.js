// dashboard.helpers.js

export const groupCount = (arr, keyGetter) => {
  const map = new Map();

  for (const item of arr) {
    const key = keyGetter(item) ?? 'Sin dato';
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, Cantidad]) => ({ name, Cantidad }))
    .sort((a, b) => b.Cantidad - a.Cantidad);
};

export const getDeviceName = (item) => item?.device?.name || item?.device_name || null;

export const getBrandName = (item) => item?.brand?.name || item?.brand_name || null;

export const getStatusName = (item) => item?.status?.name || item?.status_name || null;

const incidentMonthFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Panama', year: 'numeric', month: '2-digit',
});

export function incidentMonth(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = incidentMonthFormatter.formatToParts(date);
  return `${parts.find((part) => part.type === 'year').value}-${parts.find((part) => part.type === 'month').value}`;
}

export function incidentDepartment(item) {
  const name = item.department_name?.trim() || 'Sin departamento';
  return { key: item.id_department ? `id:${item.id_department}` : `name:${name}`, name, id: item.id_department || null, location: item.department_ubication_name?.trim() || null };
}

export function incidentDepartmentSummary(incidences, year = 'ALL', department = 'ALL') {
  const years = new Set();
  const departments = new Map();
  const monthly = new Map();
  let undated = 0;
  for (const incident of incidences) {
    const month = incidentMonth(incident.creation_date);
    if (month) years.add(month.slice(0, 4));
    if (year !== 'ALL' && (!month || !month.startsWith(`${year}-`))) continue;
    const info = incidentDepartment(incident);
    const existing = departments.get(info.key);
    departments.set(info.key, { ...info, count: (existing?.count || 0) + 1 });
    if (department !== 'ALL' && department !== info.key) continue;
    if (!month) { undated += 1; continue; }
    monthly.set(month, (monthly.get(month) || 0) + 1);
  }
  const ranked = Array.from(departments.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
  const nameCounts = new Map();
  for (const item of ranked) nameCounts.set(item.name, (nameCounts.get(item.name) || 0) + 1);
  for (const item of ranked) {
    if (nameCounts.get(item.name) <= 1) { item.label = item.name; continue; }
    const location = item.location || 'Ubicación sin registrar';
    const sameLocation = ranked.filter((other) => other.name === item.name && other.location === item.location).length > 1;
    item.label = `${item.name} · ${location}${sameLocation && item.location ? ' (ubicación repetida)' : ''}`;
  }
  return {
    years: Array.from(years).sort().reverse(), departments: ranked,
    monthly: Array.from(monthly, ([month, count]) => ({ month, count })).sort((a, b) => b.month.localeCompare(a.month)),
    undated,
  };
}
