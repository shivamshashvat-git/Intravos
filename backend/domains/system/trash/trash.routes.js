import trashController from './trash.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin } from '../../../core/middleware/rbac.js';
import { requireFeature, requireVisibleFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { getTrashTableConfig, permanentlyDeleteTrashRecord, restoreTrashRecord  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.use(authenticate, requireAdmin(), requireFeature('trash'));

router.get('/', asyncHandler((req, res, next) => trashController.get__0(req, res, next)));;
router.post('/:table/:id/restore', asyncHandler((req, res, next) => trashController.post_table__id_restore_1(req, res, next)));;
router.post('/:table/:id/permanent-delete', asyncHandler((req, res, next) => trashController.post_table__id_permanent_delete_2(req, res, next)));;

export default router;
