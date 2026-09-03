import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './roles.controller.js';
import { validateCreateRole, validateRoleId, validateUpdateRole } from './roles.validator.js';

const router = express.Router();

router.get('/', requirePermission('roles.read'), controller.getAll);
router.post('/', requirePermission('roles.create'), validateCreateRole, controller.create);
router.put('/:id', requirePermission('roles.update'), validateUpdateRole, controller.update);
router.delete('/:id', requirePermission('roles.delete'), validateRoleId, controller.remove);

export default router;