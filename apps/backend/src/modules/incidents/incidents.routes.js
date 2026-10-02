// incidents.routes.js

import express from 'express';
import rateLimit from 'express-rate-limit';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission, {
  requireAnyPermission,
} from '../../common/middleware/requirePermission.js';
import * as controller from './incidents.controller.js';
import {
  validateCreateIncident,
  validateDeleteIncident,
  validateUpdateIncidentBody,
  validateUpdateIncident,
} from './incidents.validator.js';

const router = express.Router();
const incidentCreateLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  handler: (req, res) => {
    const retryAfter = Math.max(
      1,
      Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
    );
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Ya se registró una incidencia hace poco. Intenta nuevamente en unos minutos.',
      retryAfter,
    });
  },
});
const tonerOptionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export { incidentCreateLimiter };

router.get(
  '/',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.read'),
  controller.getAll
);

router.get('/public/:token', controller.getPublicByToken);

router.get('/toner-options', tonerOptionsLimiter, controller.getTonerOptions);

router.get(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.read'),
  validateUpdateIncident,
  controller.getById
);

router.post('/', validateCreateIncident, incidentCreateLimiter, controller.create);

router.put(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requireAnyPermission('incidents.update', 'incidents.assign'),
  validateUpdateIncident,
  validateUpdateIncidentBody,
  controller.update
);

router.delete(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.delete'),
  validateDeleteIncident,
  controller.remove
);

export default router;
