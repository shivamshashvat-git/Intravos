import feedbackService from './feedback.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * FeedbackController — Industrialized Post-Trip Relationship Governance
 */
class FeedbackController {
  
  /**
   * List Managed Feedback Entries
   */
  async listFeedback(req, res, next) {
    try {
      const data = await feedbackService.listFeedback(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Orchestrate New Collection Request
   */
  async requestFeedback(req, res, next) {
    try {
      const data = await feedbackService.requestFeedback(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { feedback_request: data }, 'Feedback request registered', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Public-facing Retrieval by Token
   */
  async getFeedbackByToken(req, res, next) {
    try {
      const data = await feedbackService.getFeedbackByToken(req.params.token);
      return response.success(res, { feedback: data });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Public-facing Submission Endpoint
   */
  async submitFeedback(req, res, next) {
    try {
      const data = await feedbackService.submitFeedback(req.params.token, req.body);
      return response.success(res, { feedback: data }, 'Feedback submitted successfully');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Retire Feedback Registry Entry
   */
  async deleteFeedback(req, res, next) {
    try {
      const result = await feedbackService.deleteFeedback(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Feedback record not found', 404);
      return response.success(res, result, 'Feedback record retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new FeedbackController();
