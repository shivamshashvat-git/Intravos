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
   * Logic: Comparing agency state (tenant) to place of supply (customer location)
   */
  calculateGst(items, agencyState, placeOfSupply, defaultRate = 5.0) {
    let subtotal = 0;
    let totalVendorCost = 0;
    
    // Normalize states for comparison
    const s1 = (agencyState || '').trim().toLowerCase();
    const s2 = (placeOfSupply || '').trim().toLowerCase();
    const isIntraState = s1 === s2 && s1 !== '';

    const processedItems = items.map((item, index) => {
      const amount = toAmount(item.amount || (item.unit_price * (item.quantity || 1)) || 0);
      const vendorCost = toAmount(item.cost_price || 0);
      const quantity = item.quantity || 1;
      const rate = toAmount(item.gst_rate) !== undefined ? toAmount(item.gst_rate) : defaultRate;
      
      const gstAmount = (amount * rate) / 100;
      subtotal += amount;
      totalVendorCost += vendorCost;

      // Item level breakdown
      let itemCgst = 0;
      let itemSgst = 0;
      let itemIgst = 0;

      if (isIntraState) {
        itemCgst = gstAmount / 2;
        itemSgst = gstAmount / 2;
      } else {
        itemIgst = gstAmount;
      }

      return {
        ...item,
        amount,
        quantity,
        cost_price: vendorCost,
        gst_rate: rate,
        gst_amount: gstAmount,
        cgst: itemCgst,
        sgst: itemSgst,
        igst: itemIgst,
        total: amount + gstAmount,
        sort_order: index
      };
    });

    const totalGst = processedItems.reduce((sum, item) => sum + item.gst_amount, 0);
    const cgst = processedItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgst = processedItems.reduce((sum, item) => sum + item.sgst, 0);
    const igst = processedItems.reduce((sum, item) => sum + item.igst, 0);

    return {
      processedItems,
      subtotal,
      totalVendorCost,
      totalGst,
      cgst,
      sgst,
      igst,
      total: subtotal + totalGst,
      totalMargin: subtotal - totalVendorCost,
      gstType: isIntraState ? 'cgst_sgst' : 'igst',
      isIntraState
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
