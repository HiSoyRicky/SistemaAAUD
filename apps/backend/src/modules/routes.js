// routes.js

import express from 'express';
import attachUserContext from '../common/middleware/attachUserContext.js';
import authMiddleware from '../common/middleware/authMiddleware.js';
import requirePasswordChange from '../common/middleware/requirePasswordChange.js';
import {
  activityRouter,
  authRouter,
  brandsRouter,
  categoriesRouter,
  departmentsRouter,
  devicesRouter,
  incidentsRouter,
  inventoryRouter,
  inventoryTransferRequestsRouter,
  modelsRouter,
  permissionsRouter,
  rolesRouter,
  statusRouter,
  tonerMovementsRouter,
  tonersRouter,
  ubicationsRouter,
  usersRouter,
  warehouseRouter,
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
router.use('/inventory-transfer-requests', inventoryTransferRequestsRouter);
router.use('/toners', tonersRouter);
router.use('/toner-movements', tonerMovementsRouter);
router.use('/warehouse', warehouseRouter);
router.use('/permissions', permissionsRouter);
router.use('/roles', rolesRouter);

export default router;
