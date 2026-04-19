
import express from 'express';
import cancellationsController from './cancellations.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// List all cancellations for tenant
router.get('/', authenticate, requireAdmin(), requireFeature('cancellations'), asyncHandler(cancellationsController.listCancellations));

// Refund tracker (aggregates)
router.get('/refund-tracker', authenticate, requireAdmin(), requireFeature('cancellations'), asyncHandler(cancellationsController.getRefundTracker));

// Manual cancellation creation (if needed outside booking flow)
router.post('/', authenticate, requireAdmin(), requireWriteAccess, requireFeature('cancellations'), asyncHandler(cancellationsController.createCancellation));

// Lifecycle
router.patch('/:id/status', authenticate, requireAdmin(), requireWriteAccess, requireFeature('cancellations'), asyncHandler(cancellationsController.updateStatus));
router.patch('/:id/refund-received', authenticate, requireAdmin(), requireWriteAccess, requireFeature('cancellations'), asyncHandler(cancellationsController.recordRefundReceived));

export default router;
