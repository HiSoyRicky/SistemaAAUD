import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './tonerMovements.service.js';

export const getAll = catchAsync(async (req, res) => {
  const data = await service.getAll(req.query);
  res.json(data);
});

export const create = catchAsync(async (req, res) => {
  const data = await service.create({
    payload: req.body,
    currentUser: req.user
  });
  res.json(data);
});

export const uploadDocument = catchAsync(async (req, res) => {
  const data = await service.uploadDocument({
    idParam: req.params.id,
    file: req.file,
    currentUser: req.user
  });
  res.json(data);
});
