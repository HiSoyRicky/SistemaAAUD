import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './creationRequests.controller.js';

const router = express.Router();

router.post('/', controller.create);
router.get('/mine', controller.listMine);
router.get('/', requirePermission('creation_requests.review'), controller.listAll);
router.post('/:id/approve', requirePermission('creation_requests.review'), controller.approve);
router.post('/:id/reject', requirePermission('creation_requests.review'), controller.reject);

export default router;
