import express from 'express';
import * as controller from './brands.controller.js';
import {
  validateCreateBrand,
  validateUpdateBrand
} from './brands.validator.js';

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validateCreateBrand, controller.create);
router.put('/:id', validateUpdateBrand, controller.update);

export default router;
