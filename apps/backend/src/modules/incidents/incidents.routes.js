// incidents.routes.js

import express from 'express';
import rateLimit, { ipKeyGenerator, MemoryStore } from 'express-rate-limit';
import { requireAnyPermission } from '../../common/middleware/requirePermission.js';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './incidents.controller.js';
import catchAsync from '../../common/utils/catchAsync.js';
import { listPhysicalPrinters, getPrinterLevels } from './printerLevels.js';
import { registerIncidentCreationRoutes } from './incidentCreation.routes.js';
import {
  validateDeleteIncident,
  validateUpdateIncidentBody,
  validateUpdateIncident,
} from './incidents.validator.js';

const router = express.Router();
const buildIncidentCreateLimiter = ({ windowMs, limit, message, skipFailedRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests,
    handler: (req, res) => {
      const retryAfter = Math.max(
        1,
        Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
      );
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({ error: message, retryAfter });
    },
  });

const incidentCreateLimiter = buildIncidentCreateLimiter({
  windowMs: 3 * 60 * 1000,
  limit: 1,
  skipFailedRequests: true,
  message: 'Ya se registró una incidencia hace poco. Intenta nuevamente en unos minutos.',
});
const publicIncidentCreateLimiter = buildIncidentCreateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  message: 'Se alcanzó el límite de reportes. Intenta nuevamente más tarde.',
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  store: new MemoryStore(),
});
const tonerOptionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export { incidentCreateLimiter, publicIncidentCreateLimiter };

router.get(
  '/',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.read'),
  controller.getAll
);

router.get('/public/:token', controller.getPublicByToken);

router.get(
  '/toner-options',
  // Opciones mínimas para solicitudes públicas de tóner; la consulta valida la ubicación.
  tonerOptionsLimiter,
  controller.getTonerOptions
);

// Mismo acceso público acotado que las opciones de solicitud; no acepta direcciones IP.
const printerLevelsLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
router.get('/toner-printers', tonerOptionsLimiter, catchAsync(async (req, res) => res.json(await listPhysicalPrinters(req.query))));
router.get('/toner-printers/:id/levels', printerLevelsLimiter, catchAsync(async (req, res) => res.json(await getPrinterLevels(req.params.id, req.query))));

router.get(
  '/:id',
  authMiddleware,
  requirePasswordChange,
  requirePermission('incidents.read'),
  validateUpdateIncident,
  controller.getById
);

registerIncidentCreationRoutes(router, {
  authenticatedLimiter: incidentCreateLimiter,
  publicLimiter: publicIncidentCreateLimiter,
});

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
