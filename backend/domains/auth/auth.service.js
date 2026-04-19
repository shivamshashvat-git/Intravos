import { createClient } from '@supabase/supabase-js';
import config from '../../core/config/index.js';
import { supabaseAdmin } from '../../providers/database/supabase.js';


class AuthService {
  anonClient() {
    return createClient(config.supabase.url, config.supabase.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async login(email, password) {
    const anon = this.anonClient();
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async refresh(refresh_token) {
    const anon = this.anonClient();
    const { data, error } = await anon.auth.refreshSession({ refresh_token });
    if (error) throw error;
    return data;
  }

  async getProfile(authUserId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_id', authUserId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateGuidance(userId, tipsSeen) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ tips_seen: tipsSeen })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export default new AuthService();