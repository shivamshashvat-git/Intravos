import { createClient  } from '@supabase/supabase-js';
import config from '../../core/config/index.js';

const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function supabaseForUser(accessToken) {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export { supabaseAdmin, supabaseForUser  };
