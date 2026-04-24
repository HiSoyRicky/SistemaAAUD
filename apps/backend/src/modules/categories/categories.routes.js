import { Router } from 'express';
import { list } from './categories.controller.js';
import authMiddleware from '../../common/middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, list);

export default router;