import offerService from './offer.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * OffersController — Industrialized Marketing Assets
 */
class OffersController {
  
  async get_public__slug_0(req, res, next) {
    try {
      const data = await offerService.getPublicOffersBySlug(req.params.slug);
      return response.success(res, data);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async get__1(req, res, next) {
    try {
      const data = await offerService.listOffers(req.user.tenantId);
      return response.success(res, { offers: data });
    } catch (error) {
      next(error);
    }
  }

  async post__2(req, res, next) {
    try {
      const data = await offerService.createOffer(req.user.tenantId, req.body);
      return response.success(res, { offer: data }, 'Marketing offer registered', 201);
    } catch (error) {
      next(error);
    }
  }

  async patch_reorder_3(req, res, next) {
    try {
      await offerService.reorderOffers(req.user.tenantId, req.body.ordered_ids);
      return response.success(res, { success: true }, 'Display order synchronized');
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async patch_id_4(req, res, next) {
    try {
      const data = await offerService.updateOffer(req.user.tenantId, req.params.id, req.body);
      if (!data) return response.error(res, 'Offer not found', 404);
      return response.success(res, { offer: data }, 'Offer metadata updated');
    } catch (error) {
      next(error);
    }
  }

  async delete_id_5(req, res, next) {
    try {
      const result = await offerService.deleteOffer(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Offer not found', 404);
      return response.success(res, result, 'Offer record retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new OffersController();
