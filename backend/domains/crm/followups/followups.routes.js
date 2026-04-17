import followupsController from './followups.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('followups'), asyncHandler((req, res, next) => followupsController.get__0(req, res, next)));;

router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('followups'), asyncHandler((req, res, next) => followupsController.post__1(req, res, next)));;

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('followups'), asyncHandler((req, res, next) => followupsController.patch_id_2(req, res, next)));;

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('followups'), asyncHandler((req, res, next) => followupsController.delete_id_3(req, res, next)));;

export default router;
