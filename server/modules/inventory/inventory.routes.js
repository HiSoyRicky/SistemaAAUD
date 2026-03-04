import express from 'express';
import * as controller from './inventory.controller.js';
import {
  validateCreateInventory,
  validateUpdateInventory
} from './inventory.validator.js';

const router = express.Router();

router.get(
  '/', controller.getAll
);

router.post(
  '/',
  validateCreateInventory,
  controller.create
);

router.put(
  '/:id',
  validateUpdateInventory,
  controller.update

);

export default router;
