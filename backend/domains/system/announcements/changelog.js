import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';

async function logPlatformChange(entry) {
  if (!entry || !entry.action || !entry.title) return;

  try {
    await supabaseAdmin.from('platform_changelog').insert({
      tenant_id: entry.tenant_id || null,
      user_id: entry.user_id || null,
      action: entry.action,
      title: entry.title,
      details: entry.details || {},
    });
  } catch (error) {
    // Avoid breaking the main request path if changelog writes fail.
    logger.error('Platform changelog write failed:', error.message || error);
  }
}

export { logPlatformChange  };
