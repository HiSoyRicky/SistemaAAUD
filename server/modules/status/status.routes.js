import express from 'express';
import * as controller from './status.controller.js';
import {
  validateCreateStatus,
  validateUpdateStatus
} from './status.validator.js';

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validateCreateStatus, controller.create);
router.put('/:id', validateUpdateStatus, controller.update);

export default router;
