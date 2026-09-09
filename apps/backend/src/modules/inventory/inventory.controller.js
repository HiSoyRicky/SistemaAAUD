// inventory.controller.js

import catchAsync from '../../common/utils/catchAsync.js';

import {
  create as createInventory,
  getAdministrativeAreas as listAdministrativeAreas,
  getAll as getAllInventory,
  getInventoryFilterOptions,
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

export const getFilterOptions = catchAsync(async (req, res) => {
  const filters = {
    ubication: req.query.ubication?.trim(),
    department: req.query.department?.trim(),
    administrative_area: req.query.administrative_area?.trim(),
    user: req.query.user?.trim(),
    device: req.query.device?.trim(),
    brand: req.query.brand?.trim(),
    model: req.query.model?.trim(),
    status: req.query.status?.trim(),
  };

  res.json(await getInventoryFilterOptions(filters));
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
