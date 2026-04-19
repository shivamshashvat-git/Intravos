import express from 'express';
import authController from './auth.controller.js';
import { asyncHandler } from '../../core/middleware/errorHandler.js';
import { validate } from '../../core/middleware/validate.js';
import { authenticate } from '../../core/middleware/auth.js';
import { requireAdmin } from '../../core/middleware/rbac.js';
import { loginSchema, inviteSchema } from './auth.schema.js';

const router = express.Router();

/**
 * Authentication & Identity Routes
 * Mount point: /api/v1/auth
 */

// Identity verification
router.get('/me', authenticate, asyncHandler((req, res) => authController.getMe(req, res)));

// Session management
router.post('/login', validate(loginSchema), asyncHandler((req, res) => authController.login(req, res)));

// Team Invitation (Requires Admin)
router.post('/invite', authenticate, requireAdmin(), validate(inviteSchema), asyncHandler((req, res) => authController.invite(req, res)));

export default router;
