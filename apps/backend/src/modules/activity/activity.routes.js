import { Router } from 'express';
import * as controller from './activity.controller.js';
import requirePermission from '../../common/middleware/requirePermission.js';

const router = Router();

router.get(
  '/',
  requirePermission('users.read'),
  controller.getAll
);

export default router;
