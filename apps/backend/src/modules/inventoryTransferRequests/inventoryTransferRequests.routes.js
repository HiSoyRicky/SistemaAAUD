import express from 'express';
import requireRole from '../../common/middleware/requireRole.js';
import * as controller from './inventoryTransferRequests.controller.js';

const router = express.Router();

router.get('/', requireRole('admin'), controller.getAll);
router.post('/', requireRole('admin', 'tecnico', 'consultor'), controller.create);
router.post('/:id/approve', requireRole('admin'), controller.approve);
router.post('/:id/reject', requireRole('admin'), controller.reject);
router.post('/:id/request-correction', requireRole('admin'), controller.requestCorrection);

export default router;