import pino from 'pino';

/**
 * Shared structured logger for background services, utils, and cron jobs.
 * Import this instead of using console.log/error/warn.
 */
const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
});

export default logger;
