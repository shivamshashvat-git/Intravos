import logger from '../utils/logger.js';

/**
 * Financial Blinder Middleware
 * 
 * Protects sensitive agency financial data from being leaked to non-admin staff.
 * Recursively scrubs cost prices, margins, and profit calculations from JSON responses
 * if the authenticated user has a 'staff' role.
 */

const SENSITIVE_FINANCIAL_KEYS = new Set([
  'cost_price',
  'cost_to_agency',
  'vendor_cost',
  'vendor_net',
  'net_profit',
  'profit',
  'margin',
  'gross_margin',
  'markup_amount',
  'commission_amount',
  'agency_cancellation_loss',
  'supplier_refund_due',
  'supplier_refund_received'
]);

function recursiveScrub(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(item => recursiveScrub(item));
  } else if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_FINANCIAL_KEYS.has(key)) {
        // We set to null or delete? Deleting is safer for frontend logic consistency
        delete obj[key];
      } else {
        recursiveScrub(obj[key]);
      }
    }
  }
}

export function financialBlinder(req, res, next) {
  // Only apply to staff. admins and super_admins see everything.
  if (!req.user || req.user.role !== 'staff') {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data) {
    try {
      if (data && typeof data === 'object') {
        recursiveScrub(data);
      }
    } catch (err) {
      logger.error('[FinancialBlinder] Scrubbing failed:', err);
    }
    return originalJson.call(this, data);
  };

  next();
}
