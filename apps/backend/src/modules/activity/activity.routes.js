// activity.routes.js

import { Router } from 'express';
import { requireAllPermissions } from '../../common/middleware/requirePermission.js';
import * as controller from './activity.controller.js';

const router = Router();

router.get('/', requireAllPermissions('admin.panel.read', 'users.read'), controller.getAll);

export default router;
