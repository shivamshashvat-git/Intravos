import visaController from './visa.controller.js';
import express from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// ── ANALYTICS & ALERTS ──

router.get('/analytics', authenticate, requireStaff(), requireFeature('visa_tracking'), asyncHandler(visaController.getAnalytics));
router.get('/alerts', authenticate, requireStaff(), requireFeature('visa_tracking'), asyncHandler(visaController.getAlerts));
router.post('/check-stale', authenticate, requireAdmin(), requireFeature('visa_tracking'), asyncHandler(visaController.triggerStaleCheck));

// ── CRUD ──

router.get('/', authenticate, requireStaff(), requireFeature('visa_tracking'), asyncHandler(visaController.get__0));
router.get('/:id', authenticate, requireStaff(), requireFeature('visa_tracking'), asyncHandler(visaController.get_id_1));
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler(visaController.post__2));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler(visaController.patch_id_3));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler(visaController.delete_id_4));

// ── DOCUMENTS ──

router.get('/:id/documents', authenticate, requireStaff(), requireFeature('visa_tracking'), asyncHandler((req, res, next) => {
    // Reusing get_id_1's logic for fetching documents is already in get_id_1, 
    // but we can add a dedicated documents list if needed.
    // For now, getRecord includes documents.
    return visaController.get_id_1(req, res, next);
}));

router.post('/:id/documents', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler(visaController.post_id_documents_5));
router.patch('/:id/documents/:docId', authenticate, requireStaff(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler(visaController.patch_id_documents__docId_6));
router.delete('/:id/documents/:docId', authenticate, requireAdmin(), requireWriteAccess, requireFeature('visa_tracking'), asyncHandler(visaController.delete_id_documents_docId));

export default router;
