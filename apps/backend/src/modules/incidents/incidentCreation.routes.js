import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './incidents.controller.js';
import { validateCreateIncident } from './incidents.validator.js';

export const registerIncidentCreationRoutes = (router, { authenticatedLimiter, publicLimiter }) => {
  router.post('/public', publicLimiter, validateCreateIncident, controller.create);
  router.post(
    '/',
    authMiddleware,
    requirePasswordChange,
    requirePermission('incidents.create'),
    validateCreateIncident,
    authenticatedLimiter,
    controller.create
  );

  return router;
};
