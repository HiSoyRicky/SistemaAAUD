import express from 'express';
import authMiddleware from '../common/middleware/authMiddleware.js';
import requirePasswordChange from '../common/middleware/requirePasswordChange.js';
import attachUserContext from '../common/middleware/attachUserContext.js';
import {
  authRouter,
  incidentsRouter,
  inventoryRouter,
  brandsRouter,
  devicesRouter,
  modelsRouter,
  departmentsRouter,
  ubicationsRouter,
  statusRouter,
  tonersRouter,
  tonerMovementsRouter,
  usersRouter,
  permissionsRouter,
  activityRouter,
  categoriesRouter,
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
router.use('/categories', categoriesRouter);

// Rutas protegidas
router.use(authMiddleware);
router.use(attachUserContext);
router.use(requirePasswordChange);
router.use('/activity', activityRouter);
router.use('/inventory', inventoryRouter);
router.use('/toners', tonersRouter);
router.use('/toner-movements', tonerMovementsRouter);
router.use('/permissions', permissionsRouter);

export default router;
