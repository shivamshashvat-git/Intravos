import importController from './import.controller.js';
import express from 'express';
import multer from 'multer';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', authenticate, requireAdmin(), requireWriteAccess, requireFeature('data_import'), upload.single('file'), asyncHandler((req, res, next) => importController.post_upload_0(req, res, next)));

router.post('/preview', authenticate, requireAdmin(), requireWriteAccess, requireFeature('data_import'), asyncHandler((req, res, next) => importController.post_preview_1(req, res, next)));

router.post('/execute', authenticate, requireAdmin(), requireWriteAccess, requireFeature('data_import'), asyncHandler((req, res, next) => importController.post_execute_2(req, res, next)));

router.get('/logs', authenticate, requireAdmin(), requireFeature('data_import'), asyncHandler((req, res, next) => importController.get_logs_3(req, res, next)));

export default router;
