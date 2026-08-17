// incidents.routes.js

import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './incidents.controller.js';
import {
  validateCreateIncident,
  validateDeleteIncident,
  validateUpdateIncident,
} from './incidents.validator.js';

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.read'),
  controller.getAll
);

router.get('/public/:token', controller.getPublicByToken);

router.get('/toner-options', controller.getTonerOptions);

router.get(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.read'),
  validateUpdateIncident,
  controller.getById
);

router.post('/', validateCreateIncident, controller.create);

router.put(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.update'),
  validateUpdateIncident,
  controller.update
);

router.delete(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.delete'),
  validateDeleteIncident,
  controller.remove
);

export default router;
