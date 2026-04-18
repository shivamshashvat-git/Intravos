import { toAmount } from '../../../core/utils/helpers.js';

/**
 * FinancialService — Core Business Math for SaaS Operations
 */
class FinancialService {
  /**
   * Determine Indian Financial Year (starts April)
   */
  getCurrentFinancialYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed, 3 = April
    
    if (currentMonth >= 3) {
      return `${currentYear}-${String(currentYear + 1).slice(2)}`;
    } else {
      return `${currentYear - 1}-${String(currentYear).slice(2)}`;
    }
  }

  /**
   * Universal GST Calculator for Line Items
   */
  calculateGst(items, gstType = 'cgst_sgst', defaultRate = 5.0) {
    let subtotal = 0;
    let totalVendorCost = 0;

    const processedItems = items.map((item, index) => {
      const amount = toAmount(item.amount);
      const vendorCost = toAmount(item.cost_price);
      const rate = toAmount(item.gst_rate) || defaultRate;
      
      const gstAmount = (amount * rate) / 100;
      subtotal += amount;
      totalVendorCost += vendorCost;

      return {
        ...item,
        amount,
        cost_price: vendorCost,
        gst_rate: rate,
        gst_amount: gstAmount,
        sort_order: index
      };
    });

    const totalGst = processedItems.reduce((sum, item) => sum + item.gst_amount, 0);
    const cgst = gstType === 'cgst_sgst' ? totalGst / 2 : 0;
    const sgst = gstType === 'cgst_sgst' ? totalGst / 2 : 0;
    const igst = gstType === 'igst' ? totalGst : 0;

    return {
      processedItems,
      subtotal,
      totalVendorCost,
      totalGst,
      cgst,
      sgst,
      igst,
      total: subtotal + totalGst,
      totalMargin: subtotal - totalVendorCost
    };
  }

  /**
   * Safe Amount Parsing (Utility)
   */
  parseAmount(val) {
    return toAmount(val);
  }
}

export default new FinancialService();
