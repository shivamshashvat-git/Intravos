import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * NetworkService — B2B Social & Professional Relationship Orchestrator
 */
class NetworkService {
  
  // ── B2B CONNECTIONS ──

  async requestConnection(userId, targetMemberId, note) {
    if (!targetMemberId) throw new Error('target_member_id is required');
    
    const { data, error } = await supabaseAdmin
      .from('network_connections')
      .insert({
        requester_member_id: userId,
        target_member_id: targetMemberId,
        status: 'pending',
        note: note || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateConnectionStatus(userId, connectionId, status) {
    if (!['accepted', 'declined', 'blocked'].includes(status)) {
      throw new Error('Status must be accepted, declined, or blocked');
    }

    const updates = { status };
    if (status === 'accepted') updates.connected_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('network_connections')
      .update(updates)
      .eq('id', connectionId)
      .eq('target_member_id', userId) // Ownership check
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Connection request not found');
    return data;
  }

  async getConnections(userId, status) {
    let query = supabaseAdmin
      .from('network_connections')
      .select('*')
      .or(`requester_member_id.eq.${userId},target_member_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async discoverMembers(userId) {
    const { data: members, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar_url, role, tenants(id, name, slug)')
      .neq('id', userId)
      .eq('is_active', true)
      .limit(100);

    if (error) throw error;

    const { data: connections } = await supabaseAdmin
      .from('network_connections')
      .select('*')
      .or(`requester_member_id.eq.${userId},target_member_id.eq.${userId}`);

    return (members || []).map(m => {
      const conn = (connections || []).find(c => (c.requester_member_id === m.id || c.target_member_id === m.id));
      return {
        ...m,
        connection_status: conn ? conn.status : 'none',
        connection_id: conn ? conn.id : null,
        is_requester: conn ? conn.requester_member_id === userId : false
      };
    });
  }

  // ── SOCIAL FEED ──

  async getFeed(page = 1, limit = 25) {
    const { data, error, count } = await supabaseAdmin
      .from('network_feed_posts')
      .select('*', { count: 'exact' })
      .eq('moderation_status', 'clear')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { feed: data || [], total: count, page: parseInt(page) };
  }

  async createPost(userId, tenantId, role, payload) {
    const { content, post_type, media_urls, destination_tags, visibility } = payload;
    if (!content) throw new Error('Content is required');

    const isSuperAdmin = role === 'super_admin';

    const { data, error } = await supabaseAdmin
      .from('network_feed_posts')
      .insert({
        member_id: userId,
        tenant_id: tenantId,
        post_type: post_type || 'update',
        content,
        media_urls: media_urls || [],
        destination_tags: destination_tags || [],
        visibility: visibility || 'network',
        quality_disabled: isSuperAdmin
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async reactToPost(userId, postId, reactionType) {
    const { data, error } = await supabaseAdmin
      .from('network_feed_reactions')
      .upsert({
        post_id: postId,
        member_id: userId,
        reaction_type: reactionType || 'like'
      }, { onConflict: 'post_id,member_id' })
      .select()
      .single();

    if (error) throw error;

    // Async Update (background sync)
    this._recountReactions(postId);
    return data;
  }

  async removeReaction(userId, postId) {
    const { error } = await supabaseAdmin
      .from('network_feed_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('member_id', userId);

    if (error) throw error;
    this._recountReactions(postId);
  }

  async commentOnPost(userId, postId, payload) {
    const { comment_text, parent_comment_id } = payload;
    if (!comment_text) throw new Error('comment_text is required');

    const { data, error } = await supabaseAdmin
      .from('network_feed_comments')
      .insert({
        post_id: postId,
        member_id: userId,
        comment_text,
        parent_comment_id: parent_comment_id || null
      })
      .select()
      .single();

    if (error) throw error;
    this._recountComments(postId);
    return data;
  }

  async getComments(postId) {
    const { data, error } = await supabaseAdmin
      .from('network_feed_comments')
      .select('*')
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async ratePostQuality(userId, postId, rating) {
    if (!rating || rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

    const { data: post } = await supabaseAdmin.from('network_feed_posts').select('quality_disabled').eq('id', postId).single();
    if (!post) throw new Error('Post not found');
    if (post.quality_disabled) throw new Error('Quality rating is disabled for this post');

    const { data, error } = await supabaseAdmin
      .from('network_post_quality_ratings')
      .upsert({ post_id: postId, rater_member_id: userId, rating }, { onConflict: 'post_id,rater_member_id' })
      .select()
      .single();

    if (error) throw error;
    this._recalculateQualityScore(postId);
    return data;
  }

  // ── MESSAGING ──

  async getDMs(userId, targetUserId) {
    if (!targetUserId) throw new Error('target_user_id is required');

    const { data, error } = await supabaseAdmin
      .from('network_messages')
      .select(`*, sender:sender_id(name, email, avatar_url), receiver:receiver_id(name, email, avatar_url)`)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async sendDM(userId, targetUserId, message) {
    if (!targetUserId || !message) throw new Error('target_user_id and message are required');

    const { data, error } = await supabaseAdmin
      .from('network_messages')
      .insert({ sender_id: userId, receiver_id: targetUserId, message })
      .select(`*, sender:sender_id(name, email, avatar_url), receiver:receiver_id(name, email, avatar_url)`)
      .single();

    if (error) throw error;
    return data;
  }

  // ── PARTNERS & OFFERS ──

  async getOffers(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('itineraries')
      .select('id, title, destination, cover_image, selling_price, inclusions, published_at, option_label, share_token, tenant:tenant_id(id, name, slug)')
      .eq('is_published', true)
      .eq('is_template', true)
      .neq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async inviteExternalPartner(userId, name, payload) {
    const { email, invite_name, note, role } = payload;
    if (!email || !invite_name) throw new Error('Email and Name are required');

    const isSuperAdmin = role === 'super_admin';

    if (!isSuperAdmin) {
      const { count } = await supabaseAdmin
        .from('network_connections')
        .select('*', { count: 'exact', head: true })
        .eq('requester_member_id', userId)
        .eq('status', 'pending');

      if ((count || 0) >= 5) throw new Error('Upgrade to PRO to invite more than 5 external partners simultaneously.');
    }

    const { data, error } = await supabaseAdmin
      .from('network_connections')
      .insert({
        requester_member_id: userId,
        invite_email: email,
        invite_name,
        status: 'invited',
        note: note || 'Invited to join Intravos Network',
        is_demo_invite: true
      })
      .select()
      .single();

    if (error) throw error;

    if (!isSuperAdmin) {
      await supabaseAdmin.from('notifications').insert({
        tenant_id: '00000000-0000-0000-0000-000000000000', // HQ
        type: 'system',
        subject: 'External Partner Invited',
        message: `${name} from an agency invited ${invite_name} (${email}). Review and Approve for Network access.`,
        data: { invite_id: data.id, requester_id: userId }
      });
    }

    return data;
  }

  async resolveInvite(inviteId, action) {
    if (!['approve', 'disapprove'].includes(action)) throw new Error('Action must be approve or disapprove');

    const status = action === 'approve' ? 'invited_approved' : 'invited_rejected';

    const { data: invite, error } = await supabaseAdmin
      .from('network_connections')
      .update({ status })
      .eq('id', inviteId)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('notifications').insert({
      tenant_id: invite.requester_tenant_id,
      user_id: invite.requester_member_id,
      type: 'system',
      subject: `Partner Invite ${action === 'approve' ? 'Approved' : 'Declined'}`,
      message: `Your invitation for ${invite.invite_name} has been ${action}.`,
      data: { invite_id: inviteId }
    });

    return invite;
  }

  // ── B2B OPPORTUNITY MARKETPLACE ──

  async createOpportunity(userId, tenantId, payload) {
    const { title, description, opportunity_type, destination, budget, urgency } = payload;
    if (!title || !opportunity_type) throw new Error('Title and opportunity_type are required');

    const { data, error } = await supabaseAdmin
      .from('network_opportunities')
      .insert({
        posted_by: userId,
        tenant_id: tenantId,
        title,
        description,
        type: opportunity_type, // 'lead_dispatch' or 'expert_help'
        destination,
        budget: budget || null,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOpportunities(filters = {}) {
    let query = supabaseAdmin
      .from('network_opportunities')
      .select(`*, member:posted_by(name, email, avatar_url), tenant:tenant_id(name, slug)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.destination) query = query.ilike('destination', `%${filters.destination}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async applyToOpportunity(userId, opportunityId, pitch) {
    // Application logic (can be a DM or a specific tracking table)
    const { data: opp } = await supabaseAdmin.from('network_opportunities').select('posted_by, title').eq('id', opportunityId).single();
    if (!opp) throw new Error('Opportunity not found');

    // For now, we bridge with a DM automatically
    return await this.sendDM(userId, opp.posted_by, `[Marketplace Interest] Regarding: ${opp.title}\n\n${pitch}`);
  }

  async closeOpportunity(userId, opportunityId) {
    const { data, error } = await supabaseAdmin
      .from('network_opportunities')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', opportunityId)
      .eq('posted_by', userId) // Ownership check
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ── SUPER ADMIN MODERATION ──

  async moderatePost(userId, postId) {
    const { data, error } = await supabaseAdmin
      .from('network_feed_posts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        moderation_status: 'removed'
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ── INTERNAL HELPERS ──

  async _recountReactions(postId) {
    const { count } = await supabaseAdmin.from('network_feed_reactions').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    await supabaseAdmin.from('network_feed_posts').update({ likes_count: count || 0 }).eq('id', postId);
  }

  async _recountComments(postId) {
    const { count } = await supabaseAdmin.from('network_feed_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId).is('deleted_at', null);
    await supabaseAdmin.from('network_feed_posts').update({ comments_count: count || 0 }).eq('id', postId);
  }

  async _recalculateQualityScore(postId) {
    const { data: ratings } = await supabaseAdmin.from('network_post_quality_ratings').select('rating').eq('post_id', postId);
    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await supabaseAdmin.from('network_feed_posts').update({ quality_score: avg.toFixed(2), quality_votes: ratings.length }).eq('id', postId);
    }
  }
}

export default new NetworkService();
