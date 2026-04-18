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
router.get('/', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.listBookings));
router.get('/pnr-tracker', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getPnrTracker));

// Hub & Detail
router.get('/:id/hub', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getBookingHub));
router.get('/:id', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getBookingHub)); // v1 alias to hub

// Lifecycle
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.createBooking));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.updateBooking));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.deleteBooking));

// Services Management
router.post('/:id/services', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.addBookingService));
router.patch('/:id/services/:serviceId', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.updateBookingService));
router.delete('/:id/services/:serviceId', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.deleteBookingService));

// Documents & PDFs
router.get('/:id/services/:serviceId/voucher/pdf', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getServiceVoucherPdf));
router.get('/:id/travel-pack/pdf', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getTravelPackPdf));

// Cancellation
router.post('/:id/cancel', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.cancelBooking));

export default router;
