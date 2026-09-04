// inventory.routes.js

import express from 'express';
import requirePermission, {
  requireAnyPermission,
} from '../../common/middleware/requirePermission.js';
import * as controller from './inventory.controller.js';
import { validateCreateInventory, validateUpdateInventory } from './inventory.validator.js';
import * as classificationRulesController from './classification-rules.controller.js';
import {
  validateClassificationRuleId,
  validateCreateClassificationRule,
  validateListClassificationRules,
  validateResolveClassificationRule,
  validateUpdateClassificationRule,
} from './classification-rules.validator.js';

const router = express.Router();

router.get('/', requirePermission('inventory.read'), controller.getAll);
router.get('/filter-options', requirePermission('inventory.read'), controller.getFilterOptions);
router.get('/administrative-areas', requireAnyPermission('inventory_classification_rules.read', 'inventory.read'), controller.getAdministrativeAreas);
router.get('/asset-types', requireAnyPermission('inventory_classification_rules.read', 'inventory.read'), classificationRulesController.getAssetTypes);
router.get('/asset-extensions', requireAnyPermission('inventory_classification_rules.read', 'inventory.read'), classificationRulesController.getAssetExtensions);
router.get('/classifications', requireAnyPermission('inventory_classification_rules.read', 'inventory.read'), classificationRulesController.getClassifications);
router.post('/classification-rules/resolve', requireAnyPermission('inventory_classification_rules.read', 'inventory.read'), validateResolveClassificationRule, classificationRulesController.resolve);
router.post('/classification-rules/reconcile/dry-run', requireAnyPermission('inventory_classification_rules.read', 'inventory.update'), classificationRulesController.reconciliationDryRun);
router.post('/classification-rules/reconcile', requireAnyPermission('inventory_classification_rules.reconcile', 'inventory.update'), classificationRulesController.reconciliation);
router.get(
  '/classification-rules',
  requireAnyPermission('inventory.read', 'inventory_classification_rules.read'),
  controller.getClassificationRules
);
router.get('/classification-rules/manage', requireAnyPermission('inventory_classification_rules.read', 'inventory.read'), validateListClassificationRules, classificationRulesController.list);
router.get('/classification-rules/:id', requireAnyPermission('inventory_classification_rules.read', 'inventory.read'), validateClassificationRuleId, classificationRulesController.getById);
router.post('/classification-rules', requireAnyPermission('inventory_classification_rules.create', 'inventory.update'), validateCreateClassificationRule, classificationRulesController.create);
router.put('/classification-rules/:id', requireAnyPermission('inventory_classification_rules.update', 'inventory.update'), validateUpdateClassificationRule, classificationRulesController.update);
router.patch('/classification-rules/:id/status', requireAnyPermission('inventory_classification_rules.update', 'inventory.update'), validateClassificationRuleId, classificationRulesController.setActive);
router.delete('/classification-rules/:id', requirePermission('inventory_classification_rules.delete'), validateClassificationRuleId, classificationRulesController.remove);

router.get('/history', requirePermission('inventory.read'), controller.getHistory);

router.post('/', requirePermission('inventory.create'), validateCreateInventory, controller.create);

router.put(
  '/:id',
  requireAnyPermission(
    'inventory.update',
    'inventory.update_location',
    'inventory.update_department',
    'inventory.update_assignee'
  ),
  validateUpdateInventory,
  controller.update
);

export default router;
