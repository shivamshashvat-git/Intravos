import express from 'express';
import networkController from './network.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// ── CONNECTIONS ──
router.post('/connect', authenticate, requireAdmin(), asyncHandler((req, res) => networkController.post_connect(req, res)));
router.patch('/connect/:id', authenticate, requireAdmin(), asyncHandler((req, res) => networkController.patch_connect_status(req, res)));
router.get('/connections', authenticate, requireAdmin(), asyncHandler((req, res) => networkController.get_connections(req, res)));
router.get('/members/discover', authenticate, asyncHandler((req, res) => networkController.get_discover_members(req, res)));
router.get('/offers', authenticate, asyncHandler((req, res) => networkController.get_offers(req, res)));

// ── FEED ──
router.get('/feed', authenticate, asyncHandler((req, res) => networkController.get_feed(req, res)));
router.post('/feed', authenticate, asyncHandler((req, res) => networkController.post_feed(req, res)));

// ── REACTIONS ──
router.post('/feed/:id/react', authenticate, asyncHandler((req, res) => networkController.post_react(req, res)));
router.delete('/feed/:id/react', authenticate, asyncHandler((req, res) => networkController.delete_react(req, res)));

// ── COMMENTS ──
router.get('/feed/:id/comments', authenticate, asyncHandler((req, res) => networkController.get_comments(req, res)));
router.post('/feed/:id/comments', authenticate, asyncHandler((req, res) => networkController.post_comment(req, res)));

// ── QUALITY RATING (Anonymous) ──
router.post('/feed/:id/rate', authenticate, asyncHandler((req, res) => networkController.post_rate_quality(req, res)));

// ── MODERATION (Super Admin) ──
router.delete('/feed/:id', authenticate, asyncHandler((req, res) => networkController.delete_moderate_post(req, res)));

// ── DIRECT MESSAGES (B2B) ──
router.get('/dms', authenticate, asyncHandler((req, res) => networkController.get_dms(req, res)));
router.post('/dms', authenticate, asyncHandler((req, res) => networkController.post_dm(req, res)));

export default router;
