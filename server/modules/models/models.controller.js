import catchAsync from '../../utils/catchAsync.js';
import * as service from './models.service.js';

export const getAll = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  res.json(data);
});

export const getPrinters = catchAsync(async (_req, res) => {
  const data = await service.getPrinters();
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

export const remove = catchAsync(async (req, res) => {
  const data = await service.remove(req.params.id);
  res.json(data);
});
