import express from 'express';
import requireRole from '../../common/middleware/requireRole.js';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import * as controller from './users.controller.js';
import * as validator from './users.validator.js';

const router = express.Router();

router.get('/',
  controller.getAll
);

router.get(
  '/technicians',
  controller.getTechnicians
);

router.get(
  '/roles',
  controller.getRoles);

router.get(
  '/search',
  requireRole,
  validator.validateSearchUsers,
  controller.search
);

router.post(
  '/',
  validator.validateCreateUser,
  controller.create
);

router.put(
  '/:id',
  validator.validateUpdateUser,
  controller.update
);

router.put(
  '/:id/password',
  authMiddleware,
  validator.validateUpdatePassword,
  controller.updatePassword
);

router.delete(
  '/:id',
  validator.validateUserId,
  controller.remove

);

export default router;
