import { supabaseAdmin } from '../../../providers/database/supabase.js';

export async function getPlatformSettings() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('settings')
    .single();

  if (error || !data) {
    return { maintenance_mode: false, signup_enabled: true };
  }

  return data.settings;
}
