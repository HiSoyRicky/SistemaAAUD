import express from 'express';
import upload from '../../utils/multerDocuments.js';
import * as controller from './tonerMovements.controller.js';
import * as validator from './tonerMovements.validator.js';

const router = express.Router();

router.get('/', validator.validateGetMovements, controller.getAll);
router.post('/', validator.validateCreateMovement, controller.create);
router.post(
  '/:id/upload',
  validator.validateUploadDocument,
  upload.single('document'),
  controller.uploadDocument
);

export default router;
