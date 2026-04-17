import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';

import config from './core/config/index.js';
import { errorHandler } from './core/middleware/errorHandler.js';
import { payloadSanitizer } from './core/middleware/sanitizer.js';
import { financialBlinder } from './core/middleware/financialBlinder.js';
import apiRouter from './routes/index.js';

const app = express();

// ── SENTRY INIT ──
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
});

// ── SECURITY ──
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));

// ── PARSING ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── LOGGING (Pino) ──
const pinoLogger = pino({ level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' });
app.use(pinoHttp({ logger: pinoLogger }));

// ── GLOBAL PAYLOAD SECRECY SANITIZER ──
app.use(payloadSanitizer);

// ── FINANCIAL SECURITY BLINDER ──
app.use(financialBlinder);

// ── RATE LIMITING ──
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ── SENSITIVE RATE LIMITING ──
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many authentication or capture attempts. Please try again in 15 minutes.' },
});
app.use('/api/v1/auth/login', sensitiveLimiter);

// ── HEALTH CHECK ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── DEFINITIVE API ROUTER ──
// We mount under both /api and /api/v1 for client flexibility during the transition phase,
// but v1 is the industrialized standard going forward.
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── SENTRY ERROR HANDLER ──
if (Sentry.setupExpressErrorHandler) {
  Sentry.setupExpressErrorHandler(app);
}

// ── ERROR HANDLER ──
app.use(errorHandler);

export default app;
