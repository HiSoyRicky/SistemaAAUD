// status.routes.js

import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './status.controller.js';
import { validateCreateStatus, validateUpdateStatus } from './status.validator.js';

const router = express.Router();

router.use(authMiddleware, requirePasswordChange);

router.get('/', requirePermission('status.read'), controller.getAll);
router.post('/', requirePermission('status.create'), validateCreateStatus, controller.create);
router.put('/:id', requirePermission('status.update'), validateUpdateStatus, controller.update);

export default router;
