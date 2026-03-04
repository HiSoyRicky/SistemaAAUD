import catchAsync from '../../utils/catchAsync.js';
import * as service from './incidents.service.js';

export const getAll = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  res.json(data);
});

export const getById = catchAsync(async (req, res) => {
  const data = await service.getById(req.params.id);
  res.json(data);
});

export const getPublicByToken = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  try {
    const incident = await service.getPublicByToken(token);

    if (!incident) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Token inválido o expirado. Solicita un nuevo enlace.',
        data: null
      });
    }

    return res.json({ success: true, data: incident });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'El enlace de la incidencia no es válido o ha caducado.',
        data: null
      });
    }

    return next(err);
  }
});

export const create = catchAsync(async (req, res) => {
  const data = await service.create({
    payload: req.body,
    req,
    io: req.app.get('io')
  });

  res.json(data);
});

export const update = catchAsync(async (req, res) => {
  const data = await service.update({
    idParam: req.params.id,
    payload: req.body,
    currentUser: req.user,
    io: req.app.get('io')
  });

  res.json(data);
});

export const remove = catchAsync(async (req, res) => {
  const data = await service.remove({
    idParam: req.params.id,
    password: req.body.password,
    currentUser: req.user,
    io: req.app.get('io')
  });

  res.json(data);
});
