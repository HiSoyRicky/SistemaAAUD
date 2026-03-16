import express from 'express';
import * as controller from './models.controller.js';
import {
  validateCreateModel,
  validateDeleteModel,
  validateUpdateModel
} from './models.validator.js';

const router = express.Router();

router.get('/', controller.getAll);
router.get('/printers', controller.getPrinters);
router.post('/', validateCreateModel, controller.create);
router.put('/:id', validateUpdateModel, controller.update);
router.delete('/:id', validateDeleteModel, controller.remove);

export default router;
