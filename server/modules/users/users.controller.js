import catchAsync from '../../utils/catchAsync.js';
import * as service from './users.service.js';

export const getAll = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  res.json(data);
});

export const getTechnicians = catchAsync(async (_req, res) => {
  const data = await service.getTechnicians();
  res.json(data);
});

export const getRoles = catchAsync(async (_req, res) => {
  const data = await service.getRoles();
  res.json(data);
});

export const search = catchAsync(async (req, res) => {
  const data = await service.search(req.query);
  res.json(data);
});

export const create = catchAsync(async (req, res) => {
  const data = await service.create(req.body);
  res.json(data);
});

export const update = catchAsync(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.json(data);
});

export const updatePassword = catchAsync(async (req, res) => {
  const data = await service.updatePassword(req.params.id, req.body.newPassword, {
    actor: req.user,
    requirePasswordChange: req.body.requirePasswordChange
  });
  res.json(data);
});

export const remove = catchAsync(async (req, res) => {
  const data = await service.remove(req.params.id);
  res.status(200).json(data);
});
