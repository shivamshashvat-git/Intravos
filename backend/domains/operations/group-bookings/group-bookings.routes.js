
import express from 'express';
import groupBookingsController from './group-bookings.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { validate } from '../../../core/middleware/validate.js';
import { updateGroupMemberSchema } from './group-bookings.schema.js';

const router = express.Router();

// Mounted at /api/v1/operations/group-members
router.patch('/:memberId', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(updateGroupMemberSchema), asyncHandler(groupBookingsController.updateMember));
router.delete('/:memberId', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(groupBookingsController.deleteMember));

export default router;
