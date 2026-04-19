import express from 'express';
import usersController from './users.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin, requireSecondary, requireStaff } from '../../../core/middleware/rbac.js';

const router = express.Router();

// ── PERSONAL PROFILE ──
router.get('/users/me', authenticate, usersController.getMe);
router.patch('/users/me', authenticate, usersController.updateMe);

// ── TEAM MANAGEMENT ──
router.get('/team', authenticate, requireSecondary(), usersController.listTeam);
router.post('/team/invite', authenticate, requireAdmin(), usersController.inviteUser);
router.patch('/team/:userId', authenticate, requireSecondary(), usersController.updateUser);
router.delete('/team/:userId', authenticate, requireAdmin(), usersController.deactivateUser);
router.patch('/team/:userId/reactivate', authenticate, requireAdmin(), usersController.reactivateUser);

export default router;
