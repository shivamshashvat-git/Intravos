import adminService from './admin.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * AdminController — Industrialized Platform Governance
 */
class AdminController {
  
  // ── TENANT MANAGEMENT ──

  async get_tenants_overview_0(req, res, next) {
    try {
      const result = await adminService.getTenantsOverview();
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get_tenants_expiring_1(req, res, next) {
    try {
      const data = await adminService.getExpiringTenants();
      return response.success(res, { expiring: data, total: data.length });
    } catch (error) {
      next(error);
    }
  }

  async get_tenants_at_risk_2(req, res, next) {
    try {
      const data = await adminService.getAtRiskTenants();
      return response.success(res, { at_risk: data, total: data.length });
    } catch (error) {
      next(error);
    }
  }

  // ── PLATFORM COMMUNICATION ──

  async get_changelog_3(req, res, next) {
    try {
      const data = await adminService.getChangelog(req.query);
      return response.success(res, { changelog: data });
    } catch (error) {
      next(error);
    }
  }

  async get_announcements_4(req, res, next) {
    try {
      const data = await adminService.getAnnouncements();
      return response.success(res, { announcements: data });
    } catch (error) {
      next(error);
    }
  }

  async post_announcements_5(req, res, next) {
    try {
      const data = await adminService.createAnnouncement(req.user.id, req.body);
      return response.success(res, { announcement: data }, 'Announcement published', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async patch_announcements__id_6(req, res, next) {
    try {
      const data = await adminService.updateAnnouncement(req.params.id, req.body);
      return response.success(res, { announcement: data }, 'Announcement updated');
    } catch (error) {
      next(error);
    }
  }

  async delete_announcements__id_7(req, res, next) {
    try {
      const data = await adminService.retireAnnouncement(req.params.id);
      return response.success(res, { announcement: data }, 'Announcement retired');
    } catch (error) {
      next(error);
    }
  }

  // ── REVENUE & DASHBOARD ──

  async get_revenue_dashboard_24(req, res, next) {
    try {
      const data = await adminService.getRevenueDashboard();
      return response.success(res, { revenue_dashboard: data });
    } catch (error) {
      next(error);
    }
  }

  async get_platform_payments_8(req, res, next) {
    try {
      const data = await adminService.getPlatformPayments(req.query.tenant_id);
      return response.success(res, { platform_payments: data });
    } catch (error) {
      next(error);
    }
  }

  // ── IMPERSONATION ──

  async post_impersonation_start_12(req, res, next) {
    try {
      const actor = req.impersonator || req.user;
      const data = await adminService.startImpersonation(actor, req.body);
      return response.success(res, data, 'Impersonation session established', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async post_impersonation_end_13(req, res, next) {
    try {
      const actor = req.impersonator || req.user;
      const token = req.body.session_token || req.headers['x-impersonation-token'];
      const data = await adminService.endImpersonation(actor.id, token);
      return response.success(res, { session: data }, 'Returned to super admin session');
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async get_impersonation_sessions_11(req, res, next) {
    try {
      const data = await adminService.getImpersonationSessions(req.query);
      return response.success(res, { sessions: data });
    } catch (error) {
      next(error);
    }
  }

  // ── HEALTH & SUPPORT ──

  async get_client_health_9(req, res, next) {
    try {
      const data = await adminService.getClientHealth();
      return response.success(res, { client_health: data });
    } catch (error) {
      next(error);
    }
  }

  async get_upgrade_requests_10(req, res, next) {
    try {
      const data = await adminService.getUpgradeRequests();
      return response.success(res, { upgrade_requests: data });
    } catch (error) {
      next(error);
    }
  }

  async get_support_tickets_33(req, res, next) {
    try {
      const data = await adminService.getSupportTickets(req.query);
      return response.success(res, { tickets: data });
    } catch (error) {
      next(error);
    }
  }

  // ── OPERATIONS (COUPONS & SALES) ──

  async get_coupons_18(req, res, next) {
    try {
      const data = await adminService.getCoupons();
      return response.success(res, { coupons: data });
    } catch (error) {
      next(error);
    }
  }

  async post_coupons_19(req, res, next) {
    try {
      const data = await adminService.createCoupon(req.user.id, req.body);
      return response.success(res, { coupon: data }, 'Coupon code generated', 201);
    } catch (error) {
      next(error);
    }
  }

  async patch_coupons__id_20(req, res, next) {
    try {
      const data = await adminService.updateCoupon(req.params.id, req.body);
      return response.success(res, { coupon: data }, 'Coupon terms modified');
    } catch (error) {
      next(error);
    }
  }

  async get_coupons__id_usage_21(req, res, next) {
    try {
      const data = await adminService.getCouponUsage(req.params.id);
      return response.success(res, { usage: data });
    } catch (error) {
      next(error);
    }
  }

  async get_sales_requests_22(req, res, next) {
    try {
      const data = await adminService.getSalesRequests(req.query);
      return response.success(res, { sales_requests: data });
    } catch (error) {
      next(error);
    }
  }

  async patch_sales_requests__id_23(req, res, next) {
    try {
      const data = await adminService.updateSalesRequest(req.params.id, req.body);
      return response.success(res, { sales_request: data }, 'Sales request status synchronized');
    } catch (error) {
      next(error);
    }
  }

  // ── CRM (PROSPECTS) ──

  async get_prospects_27(req, res, next) {
    try {
      const data = await adminService.getProspects(req.query.status);
      return response.success(res, { prospects: data });
    } catch (error) {
      next(error);
    }
  }

  async post_prospect_28(req, res, next) {
    try {
      const data = await adminService.createProspect(req.body);
      return response.success(res, { prospect: data }, 'Prospect record created', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('already exists')) return response.error(res, error.message, 409);
      next(error);
    }
  }

  async patch_prospect_29(req, res, next) {
    try {
      const data = await adminService.updateProspect(req.params.id, req.body);
      return response.success(res, { prospect: data }, 'Prospect profile modified');
    } catch (error) {
      next(error);
    }
  }

  // ── PLATFORM BILLING ──

  async get_platform_invoices_30(req, res, next) {
    try {
      const data = await adminService.getPlatformInvoices(req.query);
      return response.success(res, { invoices: data });
    } catch (error) {
      next(error);
    }
  }

  async post_generate_platform_invoice_31(req, res, next) {
    try {
      const data = await adminService.generatePlatformInvoice(req.user.id, req.body);
      return response.success(res, { invoice: data }, 'B2B Invoice generated', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async post_platform_invoice_payment_32(req, res, next) {
    try {
      const data = await adminService.recordPlatformInvoicePayment(req.body);
      return response.success(res, data, 'Payment captured and invoice finalized');
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  // ── SETTINGS ──

  async get_platform_settings_25(req, res, next) {
    try {
      const data = await adminService.getPlatformSettings();
      return response.success(res, { platform_settings: data });
    } catch (error) {
      next(error);
    }
  }

  async patch_platform_settings_26(req, res, next) {
    try {
      const data = await adminService.updatePlatformSettings(req.user.id, req.body);
      return response.success(res, { platform_settings: data }, 'Global configuration updated');
    } catch (error) {
      if (error.message.includes('object')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  // ── NETWORK & REFERRALS ──

  async get_network_members_14(req, res, next) {
    try {
      const data = await adminService.getNetworkMembers(req.query);
      return response.success(res, { members: data });
    } catch (error) {
      next(error);
    }
  }

  async patch_network_members__id_15(req, res, next) {
    try {
      const data = await adminService.moderateNetworkMember(req.user.id, req.params.id, req.body);
      return response.success(res, { member: data }, 'Network member status updated');
    } catch (error) {
      next(error);
    }
  }

  async get_referrals_34(req, res, next) {
    try {
      const data = await adminService.listReferrals();
      return response.success(res, { referrals: data });
    } catch (error) {
      next(error);
    }
  }

  async post_fulfill_referral_35(req, res, next) {
    try {
       const data = await adminService.fulfillReferral(req.params.id);
       return response.success(res, { referral: data }, 'Referral payout marked as fulfilled');
    } catch (error) {
      next(error);
    }
  }

  async get_all_staff(req, res, next) {
    try {
      const data = await adminService.getStaffMembers();
      return response.success(res, { staff: data });
    } catch (error) {
      next(error);
    }
  }

  // ── TENANT LIFECYCLE CONTROLS ──

  async post_grant_grace_period(req, res, next) {
    try {
      const { days } = req.body;
      const data = await adminService.grantGracePeriod(req.params.id, days || 7);
      return response.success(res, { tenant: data }, `Grace period of ${days || 7} days granted`);
    } catch (error) {
      next(error);
    }
  }

  async delete_offboard_tenant(req, res, next) {
    try {
      const data = await adminService.deactivateTenant(req.params.id);
      return response.success(res, { tenant: data }, 'Agency deactivation successful. 90-day retention countdown started.');
    } catch (error) {
      next(error);
    }
  }

  // ── REFERRAL GOVERNANCE ──

  async patch_referral_36(req, res, next) {
    try {
      const { admin_notes } = req.body;
      const data = await adminService.updateReferralNotes(req.params.id, admin_notes);
      return response.success(res, { referral: data }, 'Referral notes updated');
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
