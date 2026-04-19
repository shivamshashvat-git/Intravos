import express from 'express';
import tenantsController from './tenants.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin, requireSecondary, requireStaff } from '../../../core/middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

// ── AGENCY PROFILE ──
router.get('/', tenantsController.getTenantProfile);
router.patch('/', requireAdmin(), tenantsController.updateTenantProfile);

// ── PLATFORM/GLOBAL OVERRIDES ──
router.get('/platform', tenantsController.getPlatformSettings);
router.patch('/platform', requireAdmin(), tenantsController.updatePlatformSettings);

// ── BANK ACCOUNTS ──
router.get('/bank-accounts', tenantsController.listBankAccounts);
router.post('/bank-accounts', requireAdmin(), tenantsController.addBankAccount);
router.patch('/bank-accounts/:id', requireAdmin(), tenantsController.updateBankAccount);
router.delete('/bank-accounts/:id', requireAdmin(), tenantsController.deleteBankAccount);
router.patch('/bank-accounts/:id/primary', requireAdmin(), tenantsController.setPrimaryBankAccount);

export default router;
