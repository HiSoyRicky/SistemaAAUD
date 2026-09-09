// notificationRecipients.routes.js

import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './notificationRecipients.controller.js';

const router = express.Router();

router.get('/', requirePermission('notification_settings.read'), controller.getAll);
router.post('/', requirePermission('notification_settings.create'), controller.create);
router.patch('/:id', requirePermission('notification_settings.create'), controller.setActive);
router.delete('/:id', requirePermission('notification_settings.delete'), controller.remove);

export default router;
