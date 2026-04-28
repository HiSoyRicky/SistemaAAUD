import { Router } from 'express';
import { list } from './categories.controller.js';

const router = Router();

router.get('/', list);

export default router;
