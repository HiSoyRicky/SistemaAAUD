import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './roles.service.js';

export const getAll = catchAsync(async (_req, res) => res.json(await service.getAll()));
export const create = catchAsync(async (req, res) => res.status(201).json(await service.create(req.body)));
export const update = catchAsync(async (req, res) => res.json(await service.update(req.params.id, req.body)));
export const remove = catchAsync(async (req, res) => res.json(await service.remove(req.params.id)));