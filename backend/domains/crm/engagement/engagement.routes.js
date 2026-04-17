import engagementController from './engagement.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/feed', authenticate, requireStaff(), requireFeature('engagement'), asyncHandler((req, res, next) => engagementController.get_feed(req, res, next)));

router.get('/templates', authenticate, requireStaff(), requireFeature('engagement'), asyncHandler((req, res, next) => engagementController.get_templates(req, res, next)));

router.post('/templates', authenticate, requireStaff(), requireWriteAccess, requireFeature('engagement'), asyncHandler((req, res, next) => engagementController.post_templates(req, res, next)));

router.post('/send', authenticate, requireStaff(), requireWriteAccess, requireFeature('engagement'), asyncHandler((req, res, next) => engagementController.post_send(req, res, next)));

export default router;
