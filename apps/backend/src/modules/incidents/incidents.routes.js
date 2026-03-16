import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import * as controller from './incidents.controller.js';
import {
  validateCreateIncident,
  validateUpdateIncident,
  validateDeleteIncident
} from './incidents.validator.js';

const router = express.Router();

router.get(
  '/', controller.getAll
);
router.get(
  '/public/:token',
  controller.getPublicByToken
);
router.get(
  '/:id', validateUpdateIncident,
  controller.getById
);

router.post(
  '/',
  validateCreateIncident,
  controller.create
);

router.put(
  '/:id',
  authMiddleware,
  validateUpdateIncident,
  controller.update

);
router.delete(
  '/:id',
  authMiddleware,
  validateDeleteIncident,
  controller.remove

);

export default router;
