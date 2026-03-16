import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './departments.service.js';

export const getAll = catchAsync(async (req, res) => {
  const data = await service.getAll();
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

export const remove = catchAsync(async (req, res) => {
  const data = await service.remove(req.params.id, req.body);
  res.json(data);
});
