import { Router } from 'express';

import invoicesRoutes from './invoices/invoices.routes.js';
import quotationsRoutes from './quotations/quotations.routes.js';
import paymentsRoutes from './payments/payments.routes.js';
import expensesRoutes from './expenses/expenses.routes.js';
import vendorledgerRoutes from './vendor-ledger/vendor-ledger.routes.js';
import billingRoutes from './billing/billing.routes.js';
import markuppresetsRoutes from './markup-presets/markup-presets.routes.js';

const router = Router();

router.use('/invoices', invoicesRoutes);
router.use('/quotations', quotationsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/expenses', expensesRoutes);
router.use('/vendor-ledger', vendorledgerRoutes);
router.use('/billing', billingRoutes);
router.use('/markup-presets', markuppresetsRoutes);

export default router;
