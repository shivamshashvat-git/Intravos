import documentsController from './documents.controller.js';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin, requireStaff, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { resolveBucket  } from '../../../providers/storage/storage.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);

function extensionOf(fileName = '') {
  return fileName.split('.').pop().toLowerCase();
}

async function storageQuotaForTenant(tenantId) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();

  if (error) throw error;
  return Number(tenant?.settings?.storage_quota_bytes) || 5 * 1024 * 1024 * 1024;
}

router.get('/public/:token', asyncHandler((req, res, next) => documentsController.get_public__token_0(req, res, next)));;


// [FRICTION POINT 2 FIX]: Offline "Travel Pack" Storage Prefetch
// Lightweight lookup avoiding heavy payload transmission on mobile PNAs.
// Returns ONLY essential document metadata for bookings departing in <= 7 days.
router.get('/travel-pack/prefetch', authenticate, requireFeature('documents'), asyncHandler((req, res, next) => documentsController.get_travel_pack_prefetch_1(req, res, next)));;

router.get('/', authenticate, requireStaff(), requireFeature('documents'), asyncHandler((req, res, next) => documentsController.get__2(req, res, next)));;

router.post('/upload', authenticate, requireStaff(), requireWriteAccess, requireFeature('documents'), upload.single('file'), asyncHandler((req, res, next) => documentsController.post_upload_3(req, res, next)));;

router.get('/:id/secure-link', authenticate, requireAdmin(), requireFeature('documents'), asyncHandler((req, res, next) => documentsController.get_id_secure_link_4(req, res, next)));;

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('documents'), asyncHandler((req, res, next) => documentsController.delete_id_5(req, res, next)));;

export default router;
