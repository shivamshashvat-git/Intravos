import referralsController from './referrals.controller.js';
import express from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// Get agency's own referral code and list of referees
router.get('/me', authenticate, requireAdmin(), asyncHandler((req, res, next) => referralsController.get_me(req, res, next)));

// Update payout bank details for rewards
router.patch('/me/bank', authenticate, requireAdmin(), asyncHandler((req, res, next) => referralsController.patch_bank_details(req, res, next)));

export default router;
