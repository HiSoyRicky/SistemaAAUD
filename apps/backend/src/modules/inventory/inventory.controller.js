// inventory.controller.js

import catchAsync from '../../common/utils/catchAsync.js';

import {
  create as createInventory,
  getAdministrativeAreas as listAdministrativeAreas,
  getAll as getAllInventory,
  getClassificationRules as listClassificationRules,
} from './inventory.service.js';

import { update as updateInventory } from './services/inventory-update.service.js';

import { getHistory as getInventoryHistory } from './services/inventory-history.service.js';

export const getAll = catchAsync(async (req, res) => {
  const data = await getAllInventory(req.query);

  res.json(data);
});

export const getHistory = catchAsync(async (req, res) => {
  const data = await getInventoryHistory(req.query);

  res.json(data);
});

export const getAdministrativeAreas = catchAsync(async (_req, res) => {
  res.json(await listAdministrativeAreas());
});

export const getClassificationRules = catchAsync(async (_req, res) => {
  res.json(await listClassificationRules());
});

export const create = catchAsync(async (req, res) => {
  const data = await createInventory(req.body, req.user);

  res.status(201).json(data);
});

export const update = catchAsync(async (req, res) => {
  const data = await updateInventory(req.params.id, req.body, req.user);

  res.json(data);
});
