// departments.routes.js

import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './departments.controller.js';
import {
  validateCreateDepartment,
  validateDeleteDepartment,
  validateUpdateDepartment,
} from './departments.validator.js';

const router = express.Router();

router.get('/', controller.getAll);

router.post(
  '/',
  authMiddleware,
  requirePasswordChange,
  requirePermission('departments.create'),
  validateCreateDepartment,
  controller.create
);

router.put(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('departments.update'),
  validateUpdateDepartment,
  controller.update
);

router.delete(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('departments.delete'),
  validateDeleteDepartment,
  controller.remove
);

export default router;
