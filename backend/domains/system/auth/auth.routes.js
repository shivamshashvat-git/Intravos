import { z } from 'zod';
import express from 'express';
import { validate } from '../../../core/middleware/validate.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import authController from './auth.controller.js';

const router = express.Router();

// ── ZOD SCHEMAS ──
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is required'),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});

const sudoSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const guidanceSchema = z.object({
  tips_seen: z.array(z.string()).min(0),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  agency_name: z.string().min(2, 'Agency name is required'),
  coupon_code: z.string().min(3, 'A valid promotional coupon code is required'),
  phone: z.string().optional(),
});

// ── ROUTES ──
router.post('/register', validate(registerSchema), asyncHandler((req, res) => authController.register(req, res)));
router.post('/login', validate(loginSchema), asyncHandler((req, res) => authController.login(req, res)));
router.post('/refresh', validate(refreshSchema), asyncHandler((req, res) => authController.refresh(req, res)));
router.get('/me', authenticate, asyncHandler((req, res) => authController.getMe(req, res)));
router.post('/impersonate/:userId', authenticate, asyncHandler((req, res) => authController.impersonate(req, res)));
router.post('/logout', authenticate, asyncHandler((req, res) => authController.logout(req, res)));
router.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler((req, res) => authController.changePassword(req, res)));
router.patch('/mfa', authenticate, asyncHandler((req, res) => authController.updateMfaStatus(req, res)));
router.post('/sudo/verify', authenticate, validate(sudoSchema), asyncHandler((req, res) => authController.verifySudo(req, res)));
router.patch('/guidance', authenticate, validate(guidanceSchema), asyncHandler((req, res) => authController.updateGuidance(req, res)));

export default router;
