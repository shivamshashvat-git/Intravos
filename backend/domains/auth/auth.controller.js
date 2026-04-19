import authService from './auth.service.js';
import usersService from '../system/users/users.service.js';
import response from '../../core/utils/responseHandler.js';

class AuthController {
  
  /**
   * GET /me
   * Standard identity & session profile
   */
  async getMe(req, res) {
    try {
      // Identity data is pre-hydrated by authenticate middleware
      return response.success(res, {
        user: req.user,
        tenant: req.tenant,
        impersonation: req.impersonation || null
      }, 'Identity retrieved successfully');
    } catch (error) {
      return response.error(res, error.message);
    }
  }

  /**
   * Login - Delegated to authService
   */
  async login(req, res) {
    const { email, password } = req.body;
    try {
      const data = await authService.login(email, password);
      return response.success(res, {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
      });
    } catch (error) {
      return response.error(res, error.message, 401);
    }
  }

  /**
   * Invite - Handled via userService.provisionUser
   * Internal team invitations
   */
  async invite(req, res) {
    try {
      // payload: { email, name, role }
      const { user, invite_link } = await usersService.provisionUser(req.actor, req.body);
      
      return response.success(res, {
        user,
        invite_link,
        message: 'Invitation sent'
      }, 'User invited successfully', 201);
    } catch (error) {
      return response.error(res, error.message);
    }
  }
}

export default new AuthController();
