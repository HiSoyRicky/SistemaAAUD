import express from 'express';
import requirePermission from '../../common/middleware/requirePermission.js';
import * as controller from './warehouse.controller.js';
import {
  validateCreateWarehouseItem,
  validateCreateWarehouseMovement,
  validateCreateWarehouseBatchOut,
  validateCreateWarehouseBatchIn,
  validateListWarehouse,
  validateUpdateWarehouseItem,
} from './warehouse.validator.js';

const router = express.Router();

router.get(
  '/items',
  requirePermission('warehouse_items.read'),
  validateListWarehouse,
  controller.listItems
);
router.post(
  '/items',
  requirePermission('warehouse_items.create'),
  validateCreateWarehouseItem,
  controller.createItem
);
router.put(
  '/items/:id',
  requirePermission('warehouse_items.update'),
  validateUpdateWarehouseItem,
  controller.updateItem
);

router.get(
  '/stock',
  requirePermission('warehouse_stock.read'),
  validateListWarehouse,
  controller.listStock
);
router.get(
  '/movements',
  requirePermission('warehouse_movements.read'),
  validateListWarehouse,
  controller.listMovements
);
router.post(
  '/movements',
  requirePermission('warehouse_movements.create'),
  validateCreateWarehouseMovement,
  controller.createMovement
);
router.post('/movements/batch', requirePermission('warehouse_movements.create'), validateCreateWarehouseBatchOut, controller.createBatchOut);
router.post('/movements/batch-in', requirePermission('warehouse_movements.create'), validateCreateWarehouseBatchIn, controller.createBatchIn);

export default router;