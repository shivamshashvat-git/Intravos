
import taskController from './tasks.controller.js';
import { Router } from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = Router();

router.get('/analytics', authenticate, requireStaff(), asyncHandler(taskController.getAnalytics));
router.post('/check-overdue', authenticate, requireAdmin(), asyncHandler(taskController.triggerOverdueCheck));

router.get('/', authenticate, requireStaff(), asyncHandler(taskController.listTasks));
router.post('/', authenticate, requireStaff(), requireWriteAccess, asyncHandler(taskController.createTask));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, asyncHandler(taskController.updateTask));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, asyncHandler(taskController.deleteTask));
router.patch('/:id/complete', authenticate, requireStaff(), requireWriteAccess, asyncHandler(taskController.completeTask));

export default router;
