import usersController from './users.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin, requireStaff  } from '../../../core/middleware/rbac.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { logPlatformChange  } from '../announcements/changelog.js';

const router = express.Router();

// ── ZOD SCHEMAS ──
const userCreateSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['staff', 'admin', 'super_admin']).default('staff'),
  password: z.string().min(6).optional(),
});

// GET /api/users
router.get('/', authenticate, requireAdmin(), asyncHandler((req, res, next) => usersController.get__0(req, res, next)));;

// GET /api/users/me/summary — staff profile (must be before /:id routes)
router.get('/me/summary', authenticate, requireStaff(), asyncHandler((req, res, next) => usersController.get_me_summary_1(req, res, next)));;

// POST /api/users — invite / create profile row (auth user must exist in Supabase Auth separately)
router.post('/', authenticate, requireAdmin(), validate(userCreateSchema), asyncHandler((req, res, next) => usersController.post__2(req, res, next)));;

// PATCH /api/users/:id
router.patch('/:id', authenticate, requireAdmin(), asyncHandler((req, res, next) => usersController.patch_id_3(req, res, next)));

// PATCH /api/users/:id/features — Admin manages staff feature scoping
router.patch('/:id/features', authenticate, requireAdmin(), asyncHandler((req, res, next) => usersController.patch_id_features_4(req, res, next)));

// PATCH /api/users/:id/network-access — Admin toggles staff network access
router.patch('/:id/network-access', authenticate, requireAdmin(), asyncHandler((req, res, next) => usersController.patch_id_network_access_5(req, res, next)));

export default router;
