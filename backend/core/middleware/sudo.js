import { supabaseAdmin } from '../../providers/database/supabase.js';
import logger from '../utils/logger.js';

/**
 * Middleware to enforce "Sudo Mode" for critical actions.
 * Sudo mode requires the user to re-authenticate with their password,
 * which grants them a short-lived token (e.g., 15 minutes).
 */
export async function requireSudo(req, res, next) {
  const sudoToken = req.headers['x-sudo-token'];

  if (!sudoToken) {
    return res.status(403).json({ 
      error: 'Sudo mode required', 
      requires_sudo: true,
      message: 'This is a sensitive action. Please re-enter your password to proceed.'
    });
  }

  try {
    // We store the sudo token in the security_audit_logs temporarily, or we can use Redis.
    // For simplicity without adding Redis dependency, we'll verify it against Supabase Auth indirectly 
    // by having the frontend exchange password for a short-lived token via signInWithPassword,
    // and passing that access_token as x-sudo-token.
    
    // Validate the token specifically for the current user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(sudoToken);

    if (error || !user || user.id !== req.user.id) {
      return res.status(403).json({ error: 'Invalid or expired sudo token. Please re-authenticate.' });
    }

    // Token is valid and matches the current logged-in user.
    // We could add logic here to check token issue time to ensure it was created < 15 mins ago
    // `user.last_sign_in_at` could be used.
    const lastSignIn = new Date(user.last_sign_in_at).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;

    if (now - lastSignIn > fifteenMinutes) {
      return res.status(403).json({ error: 'Sudo session expired. Please re-authenticate.' });
    }

    // Log the successful sudo action use
    await supabaseAdmin.from('security_audit_logs').insert({
      tenant_id: req.user.tenantId,
      user_id: req.user.id,
      event_type: 'sudo_auth_success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      details: { path: req.originalUrl, method: req.method }
    });

    next();
  } catch (err) {
    logger.error('Sudo validation error:', err);
    return res.status(500).json({ error: 'Failed to validate sudo session' });
  }
}
