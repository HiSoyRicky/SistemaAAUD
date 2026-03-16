import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './brands.service.js';

export const getAll = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  res.json(data);
});

export const create = catchAsync(async (req, res) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
});

export const update = catchAsync(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.json(data);
});
