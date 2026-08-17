// ubications.routes.js

import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './ubications.controller.js';
import { validateUpdateUbication } from './ubications.validator.js';

const router = express.Router();

router.get('/', controller.getAll);
router.put(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('ubications.update'),
  validateUpdateUbication,
  controller.update
);
router.post(
  '/',
  authMiddleware,
  requirePasswordChange,
  requirePermission('ubications.create'),
  controller.create
);

export default router;
