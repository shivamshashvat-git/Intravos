import express from 'express';
import workspaceController from './workspace.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/messages', authenticate, asyncHandler(workspaceController.getMessages));
router.post('/messages', authenticate, asyncHandler(workspaceController.postMessage));

export default router;
