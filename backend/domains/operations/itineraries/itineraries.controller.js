
import itineraryService from './itinerary.service.js';
import response from '../../../core/utils/responseHandler.js';

class ItinerariesController {
  async getBookingItinerary(req, res, next) {
    try {
      const itinerary = await itineraryService.getItineraryByBooking(req.user.tenantId, req.params.bookingId);
      return response.success(res, { itinerary });
    } catch (error) {
      next(error);
    }
  }

  async createBookingItinerary(req, res, next) {
    try {
      const data = { ...req.body, booking_id: req.params.bookingId, tenant_id: req.user.tenantId };
      const itinerary = await itineraryService.createItinerary(req.user.tenantId, data);
      return response.success(res, { itinerary }, 'Itinerary created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateItinerary(req, res, next) {
    try {
      const itinerary = await itineraryService.updateItinerary(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { itinerary }, 'Itinerary updated');
    } catch (error) {
      next(error);
    }
  }

  // Day Ops
  async addItineraryDay(req, res, next) {
    try {
      const day = await itineraryService.addDay(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { day }, 'Day added', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateItineraryDay(req, res, next) {
    try {
      const day = await itineraryService.updateDay(req.user.tenantId, req.params.dayId, req.body);
      return response.success(res, { day }, 'Day updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteItineraryDay(req, res, next) {
    try {
      await itineraryService.deleteDay(req.user.tenantId, req.params.dayId);
      return response.success(res, null, 'Day removed');
    } catch (error) {
      next(error);
    }
  }

  // Item Ops
  async addItineraryItem(req, res, next) {
    try {
      const item = await itineraryService.addItem(req.user.tenantId, req.params.dayId, req.body);
      return response.success(res, { item }, 'Item added', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateItineraryItem(req, res, next) {
    try {
      const item = await itineraryService.updateItem(req.user.tenantId, req.params.itemId, req.body);
      return response.success(res, { item }, 'Item updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteItineraryItem(req, res, next) {
    try {
      await itineraryService.deleteItem(req.user.tenantId, req.params.itemId);
      return response.success(res, null, 'Item removed');
    } catch (error) {
      next(error);
    }
  }

  async reorderItineraryItems(req, res, next) {
    try {
      await itineraryService.reorderItems(req.user.tenantId, req.params.dayId, req.body.item_ids);
      return response.success(res, null, 'Items reordered');
    } catch (error) {
      next(error);
    }
  }

  async generateItineraryPdf(req, res, next) {
    try {
      const pdf = await itineraryService.generatePdf(req.user.tenantId, req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="itinerary-${req.params.id}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }
}

export default new ItinerariesController();
