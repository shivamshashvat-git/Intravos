import bookingService from './booking.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * BookingsController — Industrialized Fulfillment Management
 */
class BookingsController {
  
  async get__0(req, res, next) {
    try {
      const data = await bookingService.listBookings(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async get_id_hub(req, res, next) {
    try {
      const hub = await bookingService.getBookingHub(req.user.tenantId, req.params.id);
      if (!hub) return response.error(res, 'Booking not found', 404);
      return response.success(res, { hub });
    } catch (error) {
      next(error);
    }
  }

  async post__3(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { booking }, 'Booking created', 201);
    } catch (error) {
      next(error);
    }
  }

  async patch_id_4(req, res, next) {
    try {
      const booking = await bookingService.updateBooking(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { booking }, 'Booking updated');
    } catch (error) {
      next(error);
    }
  }

  async post_id_services_6(req, res, next) {
    try {
      const service = await bookingService.addService(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { service }, 'Service added to booking', 201);
    } catch (error) {
      next(error);
    }
  }

  async get_id_services__serviceId_voucher_pdf_9(req, res, next) {
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

  async delete_id(req, res, next) {
    try {
      await bookingService.deleteBooking(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Booking removed from records');
    } catch (error) {
      next(error);
    }
  }

  async get_pnr_tracker_1(req, res, next) {
    try {
      const tracker = await bookingService.getPnrTracker(req.user.tenantId, req.query);
      return response.success(res, { tracker });
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingsController();
