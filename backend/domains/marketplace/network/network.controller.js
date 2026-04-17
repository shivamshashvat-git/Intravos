import networkService from './network.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * NetworkController — Industrialized B2B Relationship Orchestration
 */
class NetworkController {
  
  // ── CONNECTIONS ──

  async post_connect(req, res, next) {
    try {
      const data = await networkService.requestConnection(req.user.id, req.body.target_member_id, req.body.note);
      return response.success(res, { connection: data }, 'Connection request dispatched', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async patch_connect_status(req, res, next) {
    try {
      const data = await networkService.updateConnectionStatus(req.user.id, req.params.id, req.body.status);
      return response.success(res, { connection: data }, 'Connection status updated');
    } catch (error) {
      if (error.message.includes('Status must be')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async get_connections(req, res, next) {
    try {
      const data = await networkService.getConnections(req.user.id, req.query.status);
      return response.success(res, { connections: data });
    } catch (error) {
      next(error);
    }
  }

  async get_discover_members(req, res, next) {
    try {
      const data = await networkService.discoverMembers(req.user.id);
      return response.success(res, { members: data });
    } catch (error) {
      next(error);
    }
  }

  // ── FEED POSTS ──

  async get_feed(req, res, next) {
    try {
      const data = await networkService.getFeed(req.query.page, req.query.limit);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async post_feed(req, res, next) {
    try {
      const data = await networkService.createPost(req.user.id, req.user.tenantId, req.user.userRole, req.body);
      return response.success(res, { post: data }, 'Knowledge shared on network', 201);
    } catch (error) {
      if (error.message.includes('Content is required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  // ── REACTIONS ──

  async post_react(req, res, next) {
    try {
      const data = await networkService.reactToPost(req.user.id, req.params.id, req.body.reaction_type);
      return response.success(res, { reaction: data }, 'Sentiment recorded');
    } catch (error) {
      next(error);
    }
  }

  async delete_react(req, res, next) {
    try {
      await networkService.removeReaction(req.user.id, req.params.id);
      return response.success(res, { success: true }, 'Sentiment retracted');
    } catch (error) {
      next(error);
    }
  }

  // ── COMMENTS ──

  async get_comments(req, res, next) {
    try {
      const data = await networkService.getComments(req.params.id);
      return response.success(res, { comments: data });
    } catch (error) {
      next(error);
    }
  }

  async post_comment(req, res, next) {
    try {
      const data = await networkService.commentOnPost(req.user.id, req.params.id, req.body);
      return response.success(res, { comment: data }, 'Insight added to conversation', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  // ── QUALITY RATINGS ──

  async post_rate_quality(req, res, next) {
    try {
      const data = await networkService.ratePostQuality(req.user.id, req.params.id, req.body.rating);
      return response.success(res, { rating: data }, 'Quality vote tallied');
    } catch (error) {
      if (error.message.includes('Rating must be')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      if (error.message.includes('disabled')) return response.error(res, error.message, 403);
      next(error);
    }
  }

  // ── MODERATION ──

  async delete_moderate_post(req, res, next) {
    try {
      if (req.user.userRole !== 'super_admin') return response.error(res, 'Super Admin only', 403);
      const data = await networkService.moderatePost(req.user.id, req.params.id);
      return response.success(res, { success: true, post: data }, 'Post moderated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ── DIRECT MESSAGES ──

  async get_dms(req, res, next) {
    try {
      const data = await networkService.getDMs(req.user.id, req.query.target_user_id);
      return response.success(res, { messages: data });
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async post_dm(req, res, next) {
    try {
      const data = await networkService.sendDM(req.user.id, req.body.target_user_id, req.body.message);
      return response.success(res, { message: data }, 'Communication dispatched', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  // ── OFFERS ──

  async get_offers(req, res, next) {
    try {
      const data = await networkService.getOffers(req.user.tenantId);
      return response.success(res, { offers: data });
    } catch (error) {
      next(error);
    }
  }

  // ── PARTNER INVITES ──

  async post_invite_external(req, res, next) {
    try {
      const data = await networkService.inviteExternalPartner(req.user.id, req.user.name, { ...req.body, role: req.user.userRole });
      return response.success(res, { success: true, invite: data }, 'Partner invitation dispatched', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('Upgrade to PRO')) return response.error(res, error.message, 403);
      next(error);
    }
  }

  async patch_resolve_invite(req, res, next) {
    try {
      if (req.user.userRole !== 'super_admin') return response.error(res, 'Super Admin only', 403);
      const data = await networkService.resolveInvite(req.params.id, req.body.action);
      return response.success(res, { success: true, invite: data }, 'Partner invitation status resolved');
    } catch (error) {
      if (error.message.includes('Action must be')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new NetworkController();
