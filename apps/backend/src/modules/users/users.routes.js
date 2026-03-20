import express from 'express';
import authMiddleware from '../../common/middleware/authMiddleware.js';
import requirePasswordChange from '../../common/middleware/requirePasswordChange.js';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './users.controller.js';
import * as validator from './users.validator.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/',
  requirePasswordChange,
  requirePermission('users.read'),
  controller.getAll
);

router.get(
  '/technicians',
  requirePasswordChange,
  requirePermission('users.read'),
  controller.getTechnicians
);

router.get(
  '/roles',
  requirePasswordChange,
  requirePermission('roles.read'),
  controller.getRoles);

router.get(
  '/search',
  requirePasswordChange,
  requirePermission('users.read'),
  validator.validateSearchUsers,
  controller.search
);

router.post(
  '/',
  requirePasswordChange,
  requirePermission('users.create'),
  validator.validateCreateUser,
  controller.create
);

router.put(
  '/:id',
  requirePasswordChange,
  requirePermission('users.update'),
  validator.validateUpdateUser,
  controller.update
);

router.put(
  '/:id/password',
  validator.validateUpdatePassword,
  controller.updatePassword
);

router.delete(
  '/:id',
  requirePasswordChange,
  requirePermission('users.delete'),
  validator.validateUserId,
  controller.remove

);

export default router;
