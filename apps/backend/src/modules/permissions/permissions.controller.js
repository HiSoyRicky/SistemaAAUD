import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './permissions.service.js';

export const getOverview = catchAsync(async (_req, res) => {
  const data = await service.getOverview();
  res.json(data);
});

export const getRolePermissions = catchAsync(async (req, res) => {
  const data = await service.getRolePermissions(req.params.idRole);
  res.json(data);
});

export const updateRolePermissions = catchAsync(async (req, res) => {
  const data = await service.updateRolePermissions(req.params.idRole, req.body);
  res.json(data);
});

export const getUserPermissions = catchAsync(async (req, res) => {
  const data = await service.getUserPermissions(req.params.idUser);
  res.json(data);
});

export const updateUserPermissions = catchAsync(async (req, res) => {
  const data = await service.updateUserPermissions(req.params.idUser, req.body);
  res.json(data);
});
