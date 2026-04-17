/**
 * Shared helper functions used across multiple controllers.
 */

/**
 * Safely parse a value to a numeric amount.
 * Returns 0 for null, undefined, empty string, or NaN values.
 * @param {*} val - The value to parse
 * @returns {number} The parsed float value, or 0
 */
export function toAmount(val) {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Normalizes an Indian phone number (or global) to a raw 10-digit or max-length digit string.
 * Strips spaces, parentheses, hyphens, and leading '+91', '91', or '0' for Indian context.
 * @param {string} phone
 * @returns {string|null}
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  // Strip all non-digit characters
  let digits = String(phone).replace(/\D/g, '');
  
  // If it's an Indian number format, strip the country code variants
  if (digits.length > 10) {
    if (digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith('0')) {
    // some people type 0 followed by 9 digits. Not standard, but we'll leave it or strip it.
    // Better to just let 10 digits pass as they are.
  }
  
  return digits;
}
