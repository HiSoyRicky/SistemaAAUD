// activity.routes.js

import { Router } from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './activity.controller.js';

const router = Router();

router.get('/', requirePermission('users.read'), controller.getAll);

export default router;
