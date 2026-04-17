import searchController from './search.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('global_search'), asyncHandler((req, res, next) => searchController.get__0(req, res, next)));;

export default router;
