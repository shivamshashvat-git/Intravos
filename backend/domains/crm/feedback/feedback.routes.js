import feedbackController from './feedback.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.get('/:token', asyncHandler((req, res, next) => feedbackController.getFeedbackByToken(req, res, next)));

router.patch('/:token', asyncHandler((req, res, next) => feedbackController.submitFeedback(req, res, next)));

// ── PROTECTED ENDPOINTS ──
router.get('/', authenticate, requireStaff(), requireFeature('feedback'), asyncHandler((req, res, next) => feedbackController.listFeedback(req, res, next)));

router.post('/request', authenticate, requireStaff(), requireWriteAccess, requireFeature('feedback'), asyncHandler((req, res, next) => feedbackController.requestFeedback(req, res, next)));

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('feedback'), asyncHandler((req, res, next) => feedbackController.deleteFeedback(req, res, next)));

export default router;
