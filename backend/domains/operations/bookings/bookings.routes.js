import bookingsController from './bookings.controller.js';
import express from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

/**
 * Bookings Routes — Industrialized
 */

// List & Tracker
router.get('/', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.get__0));
router.get('/pnr-tracker', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.get_pnr_tracker_1));

// Hub & Detail
router.get('/:id/hub', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.get_id_hub));
router.get('/:id', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.get_id_hub)); // v1 alias to hub

// Lifecycle
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.post__3));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.patch_id_4));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.delete_id_5));

// Services Management
router.post('/:id/services', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.post_id_services_6));
router.patch('/:id/services/:serviceId', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.patch_id_services__serviceId_7));
router.delete('/:id/services/:serviceId', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.delete_id_services__serviceId_8));

// Documents & PDFs
router.get('/:id/services/:serviceId/voucher/pdf', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.get_id_services__serviceId_voucher_pdf_9));
router.get('/:id/travel-pack/pdf', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.get_id_travel_pack_pdf_11));

// Cancellation
router.post('/:id/cancel', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.post_id_cancel_10));

export default router;
