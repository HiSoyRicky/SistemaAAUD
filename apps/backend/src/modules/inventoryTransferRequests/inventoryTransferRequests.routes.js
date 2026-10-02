// inventoryTransferRequests.routes.js

import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './inventoryTransferRequests.controller.js';

const router = express.Router();

router.get('/', requirePermission('inventory_transfers.read_all'), controller.getAll);
router.get('/mine', requirePermission('inventory_transfers.read_own'), controller.getMine);
router.post('/', requirePermission('inventory_transfers.create'), controller.create);
router.post('/:id/approve', requirePermission('inventory_transfers.review'), controller.approve);
router.post('/:id/reject', requirePermission('inventory_transfers.review'), controller.reject);
router.post(
	'/:id/request-correction',
	requirePermission('inventory_transfers.review'),
	controller.requestCorrection
);

export default router;
