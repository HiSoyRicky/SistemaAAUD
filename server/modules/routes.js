import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import requirePasswordChange from '../middleware/requirePasswordChange.js';
import {
  authRouter,
  incidentsRouter,
  inventoryRouter,
  brandsRouter,
  devicesRouter,
  modelsRouter,
  departmentsRouter,
  documentsRouter,
  ubicationsRouter,
  statusRouter,
  tonersRouter,
  tonerMovementsRouter,
  usersRouter
} from './index.js';

const router = express.Router();

// Rutas públicas
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/incidents', incidentsRouter);
router.use('/ubications', ubicationsRouter);
router.use('/departments', departmentsRouter);
router.use('/brands', brandsRouter);
router.use('/devices', devicesRouter);
router.use('/models', modelsRouter);
router.use('/status', statusRouter);

// Rutas protegidas
router.use(authMiddleware);
router.use(requirePasswordChange);

router.use('/inventory', inventoryRouter);
router.use('/documents', documentsRouter);
router.use('/toners', tonersRouter);
router.use('/toner-movements', tonerMovementsRouter);

export default router;
