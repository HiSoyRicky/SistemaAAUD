export const mapCreateDeviceResponse = (device) => ({
  success: true,
  message: 'Dispositivo creado exitosamente',
  device
});

export const mapUpdateDeviceResponse = (device) => ({
  message: 'Dispositivo actualizado correctamente',
  device
});

export const mapDeleteDeviceResponse = () => ({
  message: 'Dispositivo eliminado correctamente'
});
