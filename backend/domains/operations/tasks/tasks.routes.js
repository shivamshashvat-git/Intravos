import tasksController from './tasks.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('tasks'), asyncHandler((req, res, next) => tasksController.get__0(req, res, next)));;

router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('tasks'), asyncHandler((req, res, next) => tasksController.post__1(req, res, next)));;

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('tasks'), asyncHandler((req, res, next) => tasksController.patch_id_2(req, res, next)));;

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('tasks'), asyncHandler((req, res, next) => tasksController.delete_id_3(req, res, next)));;

export default router;
