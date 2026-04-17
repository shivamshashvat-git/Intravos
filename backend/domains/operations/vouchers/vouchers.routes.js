import vouchersController from './vouchers.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

async function fetchVoucher(tenantId, id) {
  const { data, error } = await supabaseAdmin
    .from('vouchers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

router.post('/generate', authenticate, requireStaff(), requireWriteAccess, requireFeature('vouchers'), asyncHandler((req, res, next) => vouchersController.post_generate_0(req, res, next)));;

router.get('/:id', authenticate, requireStaff(), requireFeature('vouchers'), asyncHandler((req, res, next) => vouchersController.get_id_1(req, res, next)));;

router.get('/:id/pdf', authenticate, requireStaff(), requireFeature('vouchers'), asyncHandler((req, res, next) => vouchersController.get_id_pdf_2(req, res, next)));;

router.post('/:id/send', authenticate, requireStaff(), requireWriteAccess, requireFeature('vouchers'), asyncHandler((req, res, next) => vouchersController.post_id_send_3(req, res, next)));;

export default router;
