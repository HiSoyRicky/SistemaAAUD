import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './tonerMovements.controller.js';
import * as validator from './tonerMovements.validator.js';

const router = express.Router();

router.get(
  '/',
  requirePermission('toner_movements.read'),
  validator.validateGetMovements,
  controller.getAll
);
router.post(
  '/',
  requirePermission('toner_movements.create'),
  validator.validateCreateMovement,
  controller.create
);

export default router;
