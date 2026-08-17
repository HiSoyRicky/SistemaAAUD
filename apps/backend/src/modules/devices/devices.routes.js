// devices.routes.js

import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './devices.controller.js';
import {
  validateCreateDevice,
  validateDeleteDevice,
  validateUpdateDevice,
} from './devices.validator.js';

const router = express.Router();

router.use(authMiddleware, requirePasswordChange);

router.get('/', requirePermission('devices.read'), controller.getAll);
router.post('/', requirePermission('devices.create'), validateCreateDevice, controller.create);
router.put('/:id', requirePermission('devices.update'), validateUpdateDevice, controller.update);
router.delete('/:id', requirePermission('devices.delete'), validateDeleteDevice, controller.remove);

export default router;
