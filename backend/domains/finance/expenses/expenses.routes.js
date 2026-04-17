import expensesController from './expenses.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

function toAmount(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function updateAccountBalance(tenantId, accountId, delta) {
  if (!accountId || !delta) return;

  const { data: account } = await supabaseAdmin
    .from('bank_accounts')
    .select('id, running_balance')
    .eq('id', accountId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single();

  if (!account) return;

  await supabaseAdmin
    .from('bank_accounts')
    .update({ running_balance: toAmount(account.running_balance) + delta })
    .eq('id', accountId)
    .eq('tenant_id', tenantId);
}

router.get('/categories', authenticate, requireStaff(), requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.get_categories_0(req, res, next)));;

router.post('/categories', authenticate, requireAdmin(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.post_categories_1(req, res, next)));;

router.patch('/categories/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.patch_categories__id_2(req, res, next)));;

router.delete('/categories/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.delete_categories__id_3(req, res, next)));;

router.get('/', authenticate, requireStaff(), requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.get__4(req, res, next)));;

router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.post__5(req, res, next)));;

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.patch_id_6(req, res, next)));;

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.delete_id_7(req, res, next)));;

export default router;
