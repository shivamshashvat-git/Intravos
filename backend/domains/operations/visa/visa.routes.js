import visaController from './visa.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

// ── LIST ──

// GET /api/visa
router.get('/', authenticate, requireStaff(), requireFeature('visa_tracking'), asyncHandler((req, res, next) => visaController.get__0(req, res, next)));;

// ── DETAIL ──

// GET /api/visa/:id
router.get('/:id', authenticate, requireStaff(), requireFeature('visa_tracking'), asyncHandler((req, res, next) => visaController.get_id_1(req, res, next)));;

// ── CREATE ──

// POST /api/visa
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler((req, res, next) => visaController.post__2(req, res, next)));;

// ── UPDATE ──

// PATCH /api/visa/:id
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler((req, res, next) => visaController.patch_id_3(req, res, next)));;

// ── DELETE ──

// DELETE /api/visa/:id
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler((req, res, next) => visaController.delete_id_4(req, res, next)));;

// ── DOCUMENTS ──

// POST /api/visa/:id/documents
router.post('/:id/documents', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler((req, res, next) => visaController.post_id_documents_5(req, res, next)));;

// PATCH /api/visa/:id/documents/:docId
router.patch('/:id/documents/:docId', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler((req, res, next) => visaController.patch_id_documents__docId_6(req, res, next)));;

export default router;
