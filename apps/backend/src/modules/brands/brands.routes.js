// brands.routes.js

import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './brands.controller.js';
import {
  validateCreateBrand,
  validateDeleteBrand,
  validateUpdateBrand,
} from './brands.validator.js';

const router = express.Router();

router.use(authMiddleware, requirePasswordChange);

router.get('/', requirePermission('brands.read'), controller.getAll);

router.post('/', requirePermission('brands.create'), validateCreateBrand, controller.create);
router.put('/:id', requirePermission('brands.update'), validateUpdateBrand, controller.update);
router.delete('/:id', requirePermission('brands.delete'), validateDeleteBrand, controller.remove);

export default router;
