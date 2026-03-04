import catchAsync from '../../utils/catchAsync.js';
import * as service from './documents.service.js';

export const getDocTypes = catchAsync(async (_req, res) => {
  const data = await service.getDocTypes();
  res.json(data);
});

export const getExternalEntities = catchAsync(async (_req, res) => {
  const data = await service.getExternalEntities();
  res.json(data);
});

export const getAll = catchAsync(async (req, res) => {
  const data = await service.getAll(req.ctx);
  res.json(data);
});

export const getByKey = catchAsync(async (req, res) => {
  const data = await service.getByKey(req.params, req.ctx);
  res.json(data);
});

export const create = catchAsync(async (req, res) => {
  const data = await service.create(req.body, req.user);
  res.status(201).json(data);
});

export const update = catchAsync(async (req, res) => {
  const data = await service.update({
    params: req.params,
    payload: req.body,
    currentUser: req.user
  });
  res.json(data);
});

export const remove = catchAsync(async (req, res) => {
  const data = await service.remove(req.params);
  res.json(data);
});

export const upload = catchAsync(async (req, res) => {
  const data = await service.uploadFile(req.file);
  res.json(data);
});
