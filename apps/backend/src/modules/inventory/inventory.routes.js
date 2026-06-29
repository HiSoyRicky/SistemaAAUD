import express from 'express';
import requirePermission, {
  requireAnyPermission
} from '../../common/middleware/requirePermission.js';
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

router.get(
  '/history',
  requirePermission('inventory.read'),
  controller.getHistory
);

router.post(
  '/',
  requirePermission('inventory.create'),
  validateCreateInventory,
  controller.create
);

router.put(
  '/:id',
  requireAnyPermission(
    'inventory.update',
    'inventory.update_location',
    'inventory.update_department',
    'inventory.update_assignee'
  ),
  validateUpdateInventory,
  controller.update

);

export default router;
