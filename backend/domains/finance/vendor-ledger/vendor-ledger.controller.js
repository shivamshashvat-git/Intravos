import vendorLedgerService from './vendor-ledger.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * VendorLedgerController — Industrialized Supplier Accounting
 */
class VendorLedgerController {
  
  /**
   * List Ledger Entries with Filters
   */
  async get__0(req, res, next) {
    try {
      const ledger = await vendorLedgerService.listEntries(req.user.tenantId, req.query);
      return response.success(res, { ledger });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cash Flow Alerts & Summary
   */
  async get_dashboard_1(req, res, next) {
    try {
      const summary = await vendorLedgerService.getDashboardSummary(req.user.tenantId);
      return response.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record Manual Liability/Asset
   */
  async post__2(req, res, next) {
    try {
      const entry = await vendorLedgerService.addEntry(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { ledger_entry: entry }, 'Ledger entry recorded', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Settle Ledger Item
   */
  async patch_id_mark_paid_3(req, res, next) {
    try {
      const entry = await vendorLedgerService.markPaid(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { ledger_entry: entry }, 'Ledger entry settled');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Net Supplier Position Audit
   */
  async get_supplier__supplierId_balance_4(req, res, next) {
    try {
      const summary = await vendorLedgerService.getSupplierBalance(req.user.tenantId, req.params.supplierId);
      return response.success(res, { summary });
    } catch (error) {
      next(error);
    }
  }
}

export default new VendorLedgerController();
