import suppliersController from './suppliers.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin, requireStaff, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('suppliers'), asyncHandler((req, res, next) => suppliersController.get__0(req, res, next)));;

router.get('/:id', authenticate, requireStaff(), requireFeature('suppliers'), asyncHandler((req, res, next) => suppliersController.get_id_1(req, res, next)));;

router.post('/', authenticate, requireAdmin(), requireWriteAccess, requireFeature('suppliers'), asyncHandler((req, res, next) => suppliersController.post__2(req, res, next)));;

router.put('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('suppliers'), asyncHandler((req, res, next) => suppliersController.put_id_3(req, res, next)));;

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('suppliers'), asyncHandler((req, res, next) => suppliersController.delete_id_3(req, res, next)));;

export default router;
