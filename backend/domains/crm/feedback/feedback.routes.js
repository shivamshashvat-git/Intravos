import feedbackController from './feedback.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('feedback'), asyncHandler((req, res, next) => feedbackController.get__0(req, res, next)));;

router.post('/request', authenticate, requireStaff(), requireWriteAccess, requireFeature('feedback'), asyncHandler((req, res, next) => feedbackController.post_request_1(req, res, next)));;

router.post('/public/:token', asyncHandler((req, res, next) => feedbackController.post_public__token_2(req, res, next)));;

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('feedback'), asyncHandler((req, res, next) => feedbackController.delete_id_3(req, res, next)));;

export default router;
