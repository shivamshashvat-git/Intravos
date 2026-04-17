import logger from '../utils/logger.js';

function mapSupabaseError(err) {
  // If it's not a Postgres/Supabase structured error, return null
  if (!err || !err.code) return null;

  switch (err.code) {
    case '23505': // unique_violation
      return { status: 409, message: 'Conflict: Record already exists.' };
    case '23503': // foreign_key_violation
      return { status: 400, message: 'Invalid relationship: Referenced record does not exist.' };
    case '23502': // not_null_violation
      return { status: 400, message: 'Missing required field in database.' };
    case 'PGRST116': // Single row expected but 0 found
      return { status: 404, message: 'Not Found: The requested resource does not exist.' };
    case 'PGRST301': // JWT missing or invalid
      return { status: 401, message: 'Unauthorized access.' };
    case '42P01': // undefined_table
      return { status: 500, message: 'Database configuration error: Table does not exist.' };
    case '42703': // undefined_column
      return { status: 500, message: 'Database schema mismatch: Column does not exist.' };
    case '22P02': // invalid_text_representation (e.g. bad UUID)
      return { status: 400, message: 'Invalid format specifically provided for database lookup.' };
    default:
      return null;
  }
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  logger.error('[errorHandler]', err);

  if (res.headersSent) {
    return next(err);
  }

  // Intercept and mapped structured PostgreSQL database codes natively
  const mapped = mapSupabaseError(err);
  
  if (mapped) {
    return res.status(mapped.status).json({ error: mapped.message, code: err.code });
  }

  // Fallback handler
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}

export { asyncHandler, errorHandler };
