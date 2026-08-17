// devices.dto.js

export const mapDevice = (device) => ({
  id: device.id,
  name: device.name,
  description: device.description,
  id_department: device.id_department,
  created_at: device.created_at,
  updated_at: device.updated_at,
});

export const mapCreateDeviceResponse = (device) => ({
  success: true,
  message: 'Dispositivo creado exitosamente',
  device,
});

export const mapUpdateDeviceResponse = (device) => ({
  message: 'Dispositivo actualizado correctamente',
  device,
});

export const mapDeleteDeviceResponse = () => ({
  message: 'Dispositivo eliminado correctamente',
});
