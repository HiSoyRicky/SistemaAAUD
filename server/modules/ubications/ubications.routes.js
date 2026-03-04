import express from 'express';
import * as controller from './ubications.controller.js';
import { validateUpdateUbication } from './ubications.validator.js';

const router = express.Router();

router.get('/', controller.getAll);
router.put('/:id', validateUpdateUbication, controller.update);

export default router;
