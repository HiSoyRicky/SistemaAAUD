// notificationRecipients.controller.js

import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './notificationRecipients.service.js';

export const getAll = catchAsync(async (_req, res) => res.json(await service.getAll()));

export const create = catchAsync(async (req, res) =>
  res.status(201).json(await service.create(req.body, req.user))
);

export const remove = catchAsync(async (req, res) => res.json(await service.remove(req.params.id)));

export const setActive = catchAsync(async (req, res) =>
  res.json(await service.setActive(req.params.id, req.body?.active))
);
