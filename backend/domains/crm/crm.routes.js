import { Router } from 'express';

import leadsRoutes from './leads/leads.routes.js';
import customersRoutes from './customers/customers.routes.js';
import followupsRoutes from './followups/followups.routes.js';
import engagementRoutes from './engagement/engagement.routes.js';
import feedbackRoutes from './feedback/feedback.routes.js';
import analyticsRoutes from './analytics/analytics.routes.js';
import referralsRoutes from './referrals/referrals.routes.js';

const router = Router();

router.use('/leads', leadsRoutes);
router.use('/customers', customersRoutes);
router.use('/followups', followupsRoutes);
router.use('/engagement', engagementRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/referrals', referralsRoutes);

export default router;
