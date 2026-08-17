// permissions.routes.js

import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './permissions.controller.js';
import {
  validateRoleParams,
  validateUpdateRolePermissions,
  validateUpdateUserPermissions,
  validateUserParams,
} from './permissions.validator.js';

const router = express.Router();

router.get('/me', controller.getCurrentUserPermissions);

router.get('/', requirePermission('permissions.read'), controller.getOverview);

router.get(
  '/roles/:idRole',
  validateRoleParams,
  requirePermission('permissions.read'),
  controller.getRolePermissions
);

router.put(
  '/roles/:idRole',
  validateUpdateRolePermissions,
  requirePermission('permissions.assign'),
  controller.updateRolePermissions
);

router.get(
  '/users/:idUser',
  validateUserParams,
  requirePermission('permissions.read'),
  controller.getUserPermissions
);

router.put(
  '/users/:idUser',
  validateUpdateUserPermissions,
  requirePermission('permissions.assign'),
  controller.updateUserPermissions
);

export default router;
