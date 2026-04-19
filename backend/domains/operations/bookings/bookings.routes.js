import bookingsController from './bookings.controller.js';
import express from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';
import bookingService from './booking.service.js';
import { validate } from '../../../core/middleware/validate.js';
import { createBookingSchema, updateBookingSchema, addServiceSchema, updateServiceSchema } from './bookings.schema.js';
import { cancelBookingSchema } from '../cancellations/cancellations.schema.js';
import { groupMemberSchema, updateGroupMemberSchema } from '../group-bookings/group-bookings.schema.js';
import groupBookingsController from '../group-bookings/group-bookings.controller.js';
import itinerariesController from '../itineraries/itineraries.controller.js';
import { createItinerarySchema } from '../itineraries/itineraries.schema.js';

const router = express.Router();

/**
 * Bookings Routes — Industrialized
 */

// List & Tracker
router.get('/', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.listBookings));
router.get('/pnr-tracker', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getPnrTracker));
router.get('/hub-analytics', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getBookingHubAnalytics));

// Hub & Detail
router.get('/:id/hub', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getBookingHub));
router.get('/:id', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getBookingHub)); // v1 alias to hub

// Lifecycle
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(createBookingSchema), asyncHandler(bookingsController.createBooking));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(updateBookingSchema), asyncHandler(bookingsController.updateBooking));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.deleteBooking));

// Itinerary Link
router.get('/:id/itinerary', authenticate, requireStaff(), requireFeature('itineraries'), (req, res, next) => { req.params.bookingId = req.params.id; next(); }, asyncHandler(itinerariesController.getBookingItinerary));
router.post('/:id/itinerary', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), (req, res, next) => { req.params.bookingId = req.params.id; next(); }, validate(createItinerarySchema), asyncHandler(itinerariesController.createBookingItinerary));

// Services Management
router.get('/:id/services', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getBookingServices));
router.post('/:id/services', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(addServiceSchema), asyncHandler(bookingsController.addBookingService));
router.patch('/:id/services/:serviceId', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(updateServiceSchema), asyncHandler(bookingsController.updateBookingService));
router.delete('/:id/services/:serviceId', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), asyncHandler(bookingsController.deleteBookingService));

// Documents & PDFs
router.get('/:id/services/:serviceId/voucher/pdf', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getServiceVoucherPdf));
router.get('/:id/travel-pack/pdf', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(bookingsController.getTravelPackPdf));

// Cancellation
router.post('/:id/cancel', authenticate, requireAdmin(), requireWriteAccess, requireFeature('bookings'), validate(cancelBookingSchema), asyncHandler(bookingsController.cancelBooking));

// Group Members
router.get('/:id/group-members', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(groupBookingsController.getBookingMembers));
router.post('/:id/group-members', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(groupMemberSchema), asyncHandler(groupBookingsController.addBookingMember));

// Voucher PDF — GET /api/operations/bookings/:id/voucher
router.get('/:id/voucher', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(async (req, res, next) => {
  try {
    const hub = await bookingService.getBookingHub(req.user.tenantId, req.params.id);
    if (!hub) return res.status(404).json({ error: 'Booking not found' });

    const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);

    const booking = hub.booking || hub;
    const pax = (booking.pax_adults || 0) + (booking.pax_children || 0) + (booking.pax_infants || 0);

    const templateData = {
      booking_ref: booking.booking_number || booking.booking_ref || booking.id,
      customer_name: booking.customers?.name || booking.customer_name || 'Guest',
      customer_phone: booking.customers?.phone || booking.customer_phone || '',
      customer_email: booking.customers?.email || booking.customer_email || '',
      destination: booking.destination || '',
      status: booking.status || 'confirmed',
      checkin_date: booking.travel_start_date || booking.travel_date_start || '',
      checkout_date: booking.travel_end_date || booking.travel_date_end || '',
      guests: pax || booking.total_pax || booking.pax_count || 1,
      services: (hub.services || []).map(s => ({
        service_type: s.service_type,
        description: s.description || s.service_title,
        provider: s.provider || s.supplier_name || '',
        confirmation_number: s.confirmation_number || '',
        status: s.status || ''
      }))
    };

    const pdf = await generatePdf('booking_confirmation', templateData, branding || {});
    const filename = `Voucher-${templateData.booking_ref}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    next(error);
  }
}));
export default router;
