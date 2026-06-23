import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './inventoryTransferRequests.service.js';

export const getAll = catchAsync(async (req, res) => {
  const data = await service.getAll(req.query);
  res.json(data);
});

export const create = catchAsync(async (req, res) => {
  const data = await service.create(req.body, req.user);
  res.status(201).json(data);
});

export const approve = catchAsync(async (req, res) => {
  const data = await service.approve(req.params.id, req.body, req.user);
  res.json(data);
});

export const reject = catchAsync(async (req, res) => {
  const data = await service.reject(req.params.id, req.body, req.user, 'REJECTED');
  res.json(data);
});

export const requestCorrection = catchAsync(async (req, res) => {
  const data = await service.reject(req.params.id, req.body, req.user, 'CORRECTION_REQUESTED');
  res.json(data);
});
