import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import attachUserContext from '../../middleware/attachUserContext.js';
import requireDeptRole from '../../middleware/requireDeptRole.js';
import * as controller from './documents.controller.js';
import {
  validateCompositeParams,
  validateCreateDocument
} from './documents.validator.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../public/uploads/documents');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo PDF'));
    }
    return cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(attachUserContext);
router.use(requireDeptRole(['Administrador', 'Técnico', 'Consultor']));

router.get(
  '/doc-types',
  controller.getDocTypes
);

router.get(
  '/external-entities',
  controller.getExternalEntities
);

router.get(
  '/',
  controller.getAll
);

router.get(
  '/:id/:id_ubication/:id_department/:id_doc_type',
  validateCompositeParams,
  controller.getByKey
);

router.post(
  '/',
  validateCreateDocument,
  controller.create
);

router.post(
  '/upload',
  upload.single('file'),
  controller.upload
);

router.put(
  '/:id/:id_ubication/:id_department/:id_doc_type',
  validateCompositeParams,
  controller.update
);

router.delete(
  '/:id/:id_ubication/:id_department/:id_doc_type',
  validateCompositeParams,
  controller.remove
);

export default router;
