import http from 'http';
import app from './app.js';
import config from './core/config/index.js';

const server = http.createServer(app);

server.listen(config.server.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${config.server.port} (${config.server.env})`);
});

// ── Graceful Shutdown ──
// Ensures in-flight requests complete before the process terminates during deploys.
function shutdown(signal) {
  console.log(`\n[shutdown] Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    console.log('[shutdown] HTTP server closed. Exiting.');
    process.exit(0);
  });
  // Force exit after 10 seconds if connections refuse to close
  setTimeout(() => {
    console.error('[shutdown] Forced exit after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ── Unhandled Rejection / Exception Safety Net ──
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  // Log to Sentry if available, but don't crash
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // In production, exit after logging — the process manager will restart
  if (config.server.env === 'production') {
    process.exit(1);
  }
});
