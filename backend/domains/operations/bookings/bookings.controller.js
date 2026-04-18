import bookingService from './booking.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * BookingsController — Industrialized Fulfillment Management
 */
class BookingsController {
  
  /**
   * List bookings with filters
   */
  async listBookings(req, res, next) {
    try {
      const data = await bookingService.listBookings(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch complete Booking Hub (Details + Timeline)
   */
  async getBookingHub(req, res, next) {
    try {
      const hub = await bookingService.getBookingHub(req.user.tenantId, req.params.id);
      if (!hub) return response.error(res, 'Booking not found', 404);
      return response.success(res, { hub });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { booking }, 'Booking created', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update booking state/details
   */
  async updateBooking(req, res, next) {
    try {
      const booking = await bookingService.updateBooking(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { booking }, 'Booking updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a service/item to a booking
   */
  async addBookingService(req, res, next) {
    try {
      const service = await bookingService.addService(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { service }, 'Service added to booking', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update specific booking service
   */
  async updateBookingService(req, res, next) {
    return response.error(res, 'Method not implemented', 501);
  }

  /**
   * Remove service from booking
   */
  async deleteBookingService(req, res, next) {
    return response.error(res, 'Method not implemented', 501);
  }

  /**
   * Generate Service Voucher PDF
   */
  async getServiceVoucherPdf(req, res, next) {
    try {
      const hub = await bookingService.getBookingHub(req.user.tenantId, req.params.id);
      if (!hub) return response.error(res, 'Booking not found', 404);

      const service = (hub.services || []).find(s => s.id === req.params.serviceId);
      if (!service) return response.error(res, 'Service not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('voucher', { ...hub.booking, ...service }, branding);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="voucher-${hub.booking.booking_ref}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate full Travel Pack PDF
   */
  async getTravelPackPdf(req, res, next) {
    return response.error(res, 'Method not implemented', 501);
  }

  /**
   * Process booking cancellation
   */
  async cancelBooking(req, res, next) {
    return response.error(res, 'Cancellation logic requires specialized workflow implementation', 501);
  }

  /**
   * Soft-delete/Archive booking
   */
  async deleteBooking(req, res, next) {
    try {
      await bookingService.deleteBooking(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Booking removed from records');
    } catch (error) {
      next(error);
    }
  }

  /**
   * List global PNRs for tracker
   */
  async getPnrTracker(req, res, next) {
    try {
      const tracker = await bookingService.getPnrTracker(req.user.tenantId, req.query);
      return response.success(res, { tracker });
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingsController();
