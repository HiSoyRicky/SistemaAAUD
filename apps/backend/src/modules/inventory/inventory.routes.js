import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './inventory.controller.js';
import {
  validateCreateInventory,
  validateUpdateInventory
} from './inventory.validator.js';

const router = express.Router();

router.get(
  '/',
  requirePermission('inventory.read'),
  controller.getAll
);

router.post(
  '/',
  requirePermission('inventory.create'),
  validateCreateInventory,
  controller.create
);

router.put(
  '/:id',
  requirePermission('inventory.update'),
  validateUpdateInventory,
  controller.update

);

export default router;
