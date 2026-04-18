import itineraryService from './itinerary.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { searchPlaces } from '../../../providers/places/placesService.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * ItinerariesController — Industrialized Enterprise Itinerary Orchestration
 */
class ItinerariesController {
  
  async get__1(req, res, next) {
    try {
      const { lead_id, customer_id, is_template, page = 1, limit = 50 } = req.query;
      const result = await itineraryService.getItineraries(req.user.tenantId, {
        lead_id,
        customer_id,
        is_template,
        page,
        limit
      });
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get_id_2(req, res, next) {
    try {
      const itinerary = await itineraryService.getItineraryById(req.user.tenantId, req.params.id);
      if (!itinerary) return response.error(res, 'Itinerary not found', 404);
      return response.success(res, { itinerary });
    } catch (error) {
      next(error);
    }
  }

  async post__4(req, res, next) {
    try {
      const { title } = req.body;
      if (!title) return response.error(res, 'title is required', 400);

      const itinerary = await itineraryService.createItinerary(req.user.tenantId, {
        ...req.body,
        created_by: req.user.id
      });
      return response.success(res, { itinerary }, 'Itinerary created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async patch_id_5(req, res, next) {
    try {
      const updates = { ...req.body };
      delete updates.id;
      delete updates.tenant_id;
      delete updates.share_token;
      delete updates.deleted_at;
      delete updates.deleted_by;

      const itinerary = await itineraryService.updateItinerary(req.user.tenantId, req.params.id, updates);
      if (!itinerary) return response.error(res, 'Itinerary not found', 404);
      return response.success(res, { itinerary });
    } catch (error) {
      next(error);
    }
  }

  async post_id_duplicate_7(req, res, next) {
    try {
      const copy = await itineraryService.duplicateItinerary(req.user.tenantId, req.params.id, req.user.id);
      return response.success(res, { itinerary: copy }, 'Itinerary duplicated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async delete_id_6(req, res, next) {
    try {
      const result = await itineraryService.deleteItinerary(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Itinerary not found', 404);
      return response.success(res, result, 'Itinerary record retired');
    } catch (error) {
      next(error);
    }
  }

  async get_id_pdf_3(req, res, next) {
    try {
      const data = await itineraryService.getItineraryById(req.user.tenantId, req.params.id);
      if (!data) return response.error(res, 'Itinerary not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('itinerary', data, branding);

      const clientName = data.customer_name || data.title || 'itinerary';
      const destination = data.destination || '';
      const safeName = `${clientName}${destination ? '-' + destination : ''}`.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').substring(0, 80);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="itinerary-${safeName}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  async get_hotels_search(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) return response.error(res, 'Search query required', 400);
      const results = await searchPlaces(q);
      return response.success(res, { results });
    } catch (error) { next(error); }
  }

  async get_share__token_0(req, res, next) {
    try {
      const data = await itineraryService.resolveShareToken(req.params.token);
      return response.success(res, { itinerary: data });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async post_share__token_view(req, res, next) {
    // 501: Itinerary View Analytics not yet implemented
    return response.error(res, 'Itinerary view tracking is pending implementation', 501);
  }

  async get_marketplace(req, res, next) {
    // 501: Marketplace discovery not yet ported to industrialized controller
    return response.error(res, 'Global Itinerary Marketplace is currently being optimized. Check back soon.', 501);
  }

  async get_hotels_photo(req, res, next) {
    // 501: Google Places photo hydration pending
    return response.error(res, 'Hotel photo resolution is currently unavailable', 501);
  }

  async post_id_publish_15(req, res, next) {
    try {
      const result = await itineraryService.updateItinerary(req.user.tenantId, req.params.id, { is_published: true });
      return response.success(res, { itinerary: result }, 'Itinerary published to client portal');
    } catch (error) { next(error); }
  }

  // ── DAY MUTATIONS ──

  async post_id_days_8(req, res, next) {
    try {
      const data = await itineraryService.addDay(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { day: data }, 'Day added to itinerary', 201);
    } catch (error) { next(error); }
  }

  async patch_id_days__dayId_9(req, res, next) {
    try {
      const data = await itineraryService.updateDay(req.user.tenantId, req.params.dayId, req.body);
      return response.success(res, { day: data }, 'Day metadata updated');
    } catch (error) { next(error); }
  }

  async delete_id_days__dayId_10(req, res, next) {
    try {
      await itineraryService.deleteDay(req.user.tenantId, req.params.dayId);
      return response.success(res, { success: true }, 'Day removed from itinerary');
    } catch (error) { next(error); }
  }

  // ── ITEM MUTATIONS ──

  async post_id_days__dayId_items_11(req, res, next) {
    try {
      const data = await itineraryService.addItem(req.user.tenantId, req.params.dayId, req.body);
      return response.success(res, { item: data }, 'Item added to day', 201);
    } catch (error) { next(error); }
  }

  async patch_id_days__dayId_items__itemId_12(req, res, next) {
    try {
      const data = await itineraryService.updateItem(req.user.tenantId, req.params.itemId, req.body);
      return response.success(res, { item: data }, 'Item metadata updated');
    } catch (error) { next(error); }
  }

  async delete_id_days__dayId_items__itemId_13(req, res, next) {
    try {
      await itineraryService.deleteItem(req.user.tenantId, req.params.itemId);
      return response.success(res, { success: true }, 'Item removed from day');
    } catch (error) { next(error); }
  }

  async put_id_days_reorder_14(req, res, next) {
    try {
      await itineraryService.reorderDays(req.user.tenantId, req.params.id, req.body.day_ids);
      return response.success(res, { success: true }, 'Day sequence synchronized');
    } catch (error) { next(error); }
  }
}

export default new ItinerariesController();
