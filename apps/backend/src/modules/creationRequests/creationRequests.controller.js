import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './creationRequests.service.js';

export const create = catchAsync(async (req, res) => {
  res.status(201).json(await service.create(req.body, req.user));
});
export const listMine = catchAsync(async (req, res) => res.json(await service.listMine(req.user)));
export const listAll = catchAsync(async (req, res) => res.json(await service.listAll(req.query)));
export const approve = catchAsync(async (req, res) => res.json(await service.approve(req.params.id, req.user)));
export const reject = catchAsync(async (req, res) => res.json(await service.reject(req.params.id, req.body, req.user)));
