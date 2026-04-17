import express from 'express';
import publicController from './public.controller.js';
import { authenticateApiKey } from '../../../core/middleware/auth.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// ── Lead Ingestion (Programmatic) ──
// POST /api/public/leads
router.post('/leads', authenticateApiKey, asyncHandler((req, res, next) => publicController.post_leads(req, res, next)));

// ── Offer Catalog (Tenant Specific) ──
// GET /api/public/offers
router.get('/offers', authenticateApiKey, asyncHandler((req, res, next) => publicController.get_offers(req, res, next)));

export default router;
