import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './warehouse.service.js';

export const listItems = catchAsync(async (req, res) => {
  res.json(await service.listItems(req.query));
});

export const createItem = catchAsync(async (req, res) => {
  res.status(201).json(await service.createItem(req.body));
});

export const updateItem = catchAsync(async (req, res) => {
  res.json(await service.updateItem(req.params.id, req.body));
});

export const listStock = catchAsync(async (req, res) => {
  res.json(await service.listStock(req.query));
});

export const listMovements = catchAsync(async (req, res) => {
  res.json(await service.listMovements(req.query));
});

export const createMovement = catchAsync(async (req, res) => {
  res.status(201).json(await service.createMovement({
    payload: req.body,
    currentUser: req.user,
  }));
});

export const createBatchOut = catchAsync(async (req, res) => {
  res.status(201).json(await service.createBatchOut({ payload: req.body, currentUser: req.user }));
});

export const createBatchIn = catchAsync(async (req, res) => {
  res.status(201).json(await service.createBatchIn({ payload: req.body, currentUser: req.user }));
});
