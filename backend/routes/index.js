import { Router } from 'express';

import cronRoutes from '../jobs/cron.routes.js';
import crmRoutes from '../domains/crm/crm.routes.js';
import operationsRoutes from '../domains/operations/operations.routes.js';
import financeRoutes from '../domains/finance/finance.routes.js';
import systemRoutes from '../domains/system/system.routes.js';
// import marketplaceRoutes from '../domains/marketplace/marketplace.routes.js';

import authRoutes from '../domains/auth/auth.routes.js';
import publicRoutes from '../domains/system/public/public.routes.js';
import teamRoutes from '../domains/system/users/users.routes.js';
import settingsRoutes from '../domains/system/tenants/tenants.routes.js';
import { enforceSubscription } from '../core/middleware/subscription.js';

const router = Router();

// ── Shared / Public Routes ──────────────────────────────────
router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/cron', cronRoutes);

// ── Tenant Scoped Domains ───────────────────────────────────
router.use('/crm', crmRoutes);
router.use('/operations', operationsRoutes);
router.use('/finance', financeRoutes);
router.use('/system', systemRoutes);
router.use('/', teamRoutes);
router.use('/settings', settingsRoutes);
// router.use('/marketplace', marketplaceRoutes);

export default router;
