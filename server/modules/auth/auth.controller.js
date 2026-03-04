import * as service from './auth.service.js';

function handleAuthError(res, error, fallbackMessage) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: fallbackMessage });
}

export const register = async (req, res) => {
  try {
    const data = await service.register(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleAuthError(res, error, 'Error al registrar');
  }
};

export const login = async (req, res) => {
  try {
    const data = await service.login(req.body);
    return res.json(data);
  } catch (error) {
    return handleAuthError(res, error, 'Error del servidor');
  }
};
