

import express from 'express';
import * as controller from './departments.controller.js';
import {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateDeleteDepartment
} from './departments.validator.js';

const router = express.Router();

router.get(
  '/',
  controller.getAll
);

router.post(
  '/',
  validateCreateDepartment,
  controller.create
);

router.put(
  '/:id',
  validateUpdateDepartment,
  controller.update
);

router.delete(
  '/:id',
  validateDeleteDepartment,
  controller.remove
);

export default router;
