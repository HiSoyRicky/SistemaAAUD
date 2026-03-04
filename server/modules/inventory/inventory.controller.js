import catchAsync from '../../utils/catchAsync.js';
import * as service from './inventory.service.js';

export const getAll = catchAsync(async (req, res) => {
  const data = await service.getAll(req.query);
  res.json(data);
});

export const create = catchAsync(async (req, res) => {
  const data = await service.create(req.body, req.user);
  res.status(201).json(data);
});

export const update = catchAsync(async (req, res) => {
  const data = await service.update(req.params.id, req.body, req.user);
  res.json(data);
});
