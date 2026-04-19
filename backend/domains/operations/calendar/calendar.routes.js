
import calendarController from './calendar.controller.js';
import { Router } from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = Router();

router.get('/', authenticate, requireStaff(), asyncHandler(calendarController.getEvents));
router.post('/', authenticate, requireStaff(), requireWriteAccess, asyncHandler(calendarController.createEvent));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, asyncHandler(calendarController.updateEvent));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, asyncHandler(calendarController.deleteEvent));

export default router;
