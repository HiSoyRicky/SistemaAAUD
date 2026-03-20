import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './models.controller.js';
import {
  validateCreateModel,
  validateDeleteModel,
  validateUpdateModel
} from './models.validator.js';

const router = express.Router();

router.use(authMiddleware, requirePasswordChange);

router.get('/', requirePermission('models.read'), controller.getAll);
router.get('/printers', requirePermission('models.read'), controller.getPrinters);
router.post(
  '/',
  requirePermission('models.create'),
  validateCreateModel,
  controller.create
);
router.put(
  '/:id',
  requirePermission('models.update'),
  validateUpdateModel,
  controller.update
);
router.delete(
  '/:id',
  requirePermission('models.delete'),
  validateDeleteModel,
  controller.remove
);

export default router;
