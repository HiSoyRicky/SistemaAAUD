import express from 'express';
import * as controller from './devices.controller.js';
import {
  validateCreateDevice,
  validateDeleteDevice,
  validateUpdateDevice
} from './devices.validator.js';

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validateCreateDevice, controller.create);
router.put('/:id', validateUpdateDevice, controller.update);
router.delete('/:id', validateDeleteDevice, controller.remove);

export default router;
