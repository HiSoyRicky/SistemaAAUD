export const groupCount = (arr, keyGetter) => {
  const map = new Map();

  for (const item of arr) {
    const key = keyGetter(item) ?? "Sin dato";
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, Cantidad]) => ({ name, Cantidad }))
    .sort((a, b) => b.Cantidad - a.Cantidad);
};

export const getDeviceName = (item) => item?.device?.name || item?.device_name || null;

export const getBrandName = (item) => item?.brand?.name || item?.brand_name || null;

export const getStatusName = (item) => item?.status?.name || item?.status_name || null;
