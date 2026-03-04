import express from 'express';
import * as controller from './toners.controller.js';
import * as validator from './toners.validator.js';

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validator.validateCreateToner, controller.create);
router.put('/:id', validator.validateUpdateToner, controller.update);
router.delete('/:id', validator.validateDeleteToner, controller.remove);

export default router;
