import logger from '../utils/logger.js';

/**
 * Universal Payload Sanitizer
 * Automatically purges sensitive internal database keys (like tenant_id or deleted_at)
 * from incoming POST/PUT/PATCH bodies globally. This acts as a robust Defense-in-Depth
 * safety net for routes that haven't explicitly implemented strict Zod validation schemas.
 */

const PROTECTED_KEYS = new Set([
  'tenant_id',
  'deleted_at',
  'deleted_by',
  'created_at',
  'updated_at',
  'platform_fees',
  'amount_pending', 
  'profit'
]);

function recursiveSanitize(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(item => recursiveSanitize(item));
  } else if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (PROTECTED_KEYS.has(key)) {
        delete obj[key];
      } else {
        recursiveSanitize(obj[key]);
      }
    }
  }
}

export function payloadSanitizer(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    try {
      recursiveSanitize(req.body);
    } catch (e) {
      logger.warn('Sanitizer encountered un-parseable body structure');
    }
  }
  next();
}
