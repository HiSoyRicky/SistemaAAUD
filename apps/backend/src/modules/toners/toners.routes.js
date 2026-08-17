// toners.routes.js

import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './toners.controller.js';
import * as validator from './toners.validator.js';

const router = express.Router();

router.get('/', requirePermission('toners.read'), controller.getAll);
router.post(
  '/',
  requirePermission('toners.create'),
  validator.validateCreateToner,
  controller.create
);
router.put(
  '/:id',
  requirePermission('toners.update'),
  validator.validateUpdateToner,
  controller.update
);
router.delete(
  '/:id',
  requirePermission('toners.delete'),
  validator.validateDeleteToner,
  controller.remove
);

export default router;
