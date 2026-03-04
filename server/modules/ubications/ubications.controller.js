import catchAsync from '../../utils/catchAsync.js';
import * as service from './ubications.service.js';

export const getAll = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  res.json(data);
});

export const update = catchAsync(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.status(200).json(data);
});
