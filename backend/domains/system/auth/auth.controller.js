import authService from './auth.service.js';
import tenantService from '../tenants/tenants.service.js';
import usersService from '../users/users.service.js';
import emailService from '../../../providers/communication/emailService.js';
import demoService from '../public/demoService.js';
import response from '../../../core/utils/responseHandler.js';
import logger from '../../../core/utils/logger.js';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * AuthController — Definitive Session & Identity Management
 */
class AuthController {
  
  /**
   * Industrialized Login with standard wrapper
   */
  async login(req, res) {
    const { email, password } = req.body;
    try {
      const data = await authService.login(email, password);
      
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const userId = data.user.id;
      const tenantId = data.user.app_metadata?.tenant_id;

      if (tenantId) {
        // Professional Tracking
        await usersService.update(userId, { 
          last_ip_address: ip, 
          last_user_agent: userAgent,
          last_login_at: new Date().toISOString()
        });
        
        // Security logic (Simplified for Build Phase)
        logger.info({ userId, tenantId, ip }, '[Auth] User login successful');
      }

      return response.success(res, {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
      });
    } catch (error) {
      return response.error(res, error.message, 401);
    }
  }

  /**
   * Definitive Agency Registration
   * Industrial: 'Coupon-First' strategy applied
   */
  async register(req, res) {
    const { email, password, name, agency_name, phone, coupon_code } = req.body;
    
    if (!email || !password || !name || !agency_name || !coupon_code) {
      return response.error(res, 'Missing required registration fields (Name, Email, Agency, and Coupon)', 400);
    }

    try {
      // 1. Create Identity (Supabase Auth)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone }
      });

      if (authError) throw authError;

      // 2. Provision Tenant via Service (Includes Coupon Validation)
      const tenant = await tenantService.provisionTenant({
        name: agency_name,
        email,
        coupon_code
      });

      // 3. Provision Admin User via Service
      const user = await usersService.createUser(tenant.id, {
        id: authData.user.id,
        email,
        name,
        phone,
        role: 'agency_admin'
      });

      // 4. Bind Identity to Profile
      await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
        app_metadata: { tenant_id: tenant.id, role: 'agency_admin' }
      });

      // 5. Seed Experience
      await demoService.seedDemoData(tenant.id);

      // 6. Communications
      await emailService.sendWelcomeEmail(email, name, agency_name);

      return response.success(res, {
        message: 'Agency registration successful',
        tenant_id: tenant.id,
        slug: tenant.slug
      }, 'Registration Complete', 201);

    } catch (error) {
      logger.error({ err: error.message }, '[Registration] Failed');
      return response.error(res, error.message);
    }
  }

  /**
   * Get Current Session Data
   */
  async getMe(req, res) {
    try {
      const profile = await usersService.getById(req.user.id);
      return response.success(res, {
        user: req.user,
        tenant: req.tenant,
        profile: profile || null,
      });
    } catch (error) {
      return response.error(res, error.message);
    }
  }

  // ... Other methods (impersonate, logout, etc) would follow the same pattern ...
}

export default new AuthController();
