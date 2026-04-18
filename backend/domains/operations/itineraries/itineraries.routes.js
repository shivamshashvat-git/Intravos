import itinerariesController from './itineraries.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();


// ── PUBLIC SHARE (no auth — must be before authenticated routes) ──

// GET /api/itineraries/share/:token
router.get('/share/:token', asyncHandler((req, res, next) => itinerariesController.get_share__token_0(req, res, next)));

// POST /api/itineraries/share/:token/view
router.post('/share/:token/view', asyncHandler((req, res, next) => itinerariesController.post_share__token_view(req, res, next)));

// ── MARKETPLACE (Global Discovery — restricted to authenticated users) ──

// GET /api/itineraries/marketplace
router.get('/marketplace', authenticate, asyncHandler((req, res, next) => itinerariesController.get_marketplace(req, res, next)));

// ── LIST ──

// GET /api/itineraries
router.get('/', authenticate, requireStaff(), requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.get__1(req, res, next)));;

// ── DETAIL ──

// GET /api/itineraries/:id
router.get('/hotels/search', authenticate, requireStaff(), requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.get_hotels_search(req, res, next)));

router.get('/hotels/photo', authenticate, requireStaff(), requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.get_hotels_photo(req, res, next)));

router.get('/:id', authenticate, requireStaff(), requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.get_id_2(req, res, next)));

router.get('/:id/pdf', authenticate, requireStaff(), requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.get_id_pdf_3(req, res, next)));;

// ── CREATE ──

// POST /api/itineraries
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.post__4(req, res, next)));;

// ── UPDATE ──

// PATCH /api/itineraries/:id
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.patch_id_5(req, res, next)));

// POST /api/itineraries/:id/publish
router.post('/:id/publish', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.post_id_publish_15(req, res, next)));

// ── DELETE ──

// DELETE /api/itineraries/:id
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.delete_id_6(req, res, next)));;

// ── DUPLICATE ──

// POST /api/itineraries/:id/duplicate
router.post('/:id/duplicate', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.post_id_duplicate_7(req, res, next)));;

// ── KNOWLEDGE BANK BRIDGE ──

// POST /api/itineraries/:id/load-template/:templateId
router.post('/:id/load-template/:templateId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.post_id_load_template(req, res, next)));

// POST /api/itineraries/:id/promote-to-template
router.post('/:id/promote-to-template', authenticate, requireAdmin(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.post_id_promote_to_template(req, res, next)));

// ── DAYS ──

// POST /api/itineraries/:id/days
router.post('/:id/days', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.post_id_days_8(req, res, next)));;

// PATCH /api/itineraries/:id/days/:dayId
router.patch('/:id/days/:dayId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.patch_id_days__dayId_9(req, res, next)));;

// DELETE /api/itineraries/:id/days/:dayId
router.delete('/:id/days/:dayId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.delete_id_days__dayId_10(req, res, next)));;

// ── ITEMS ──

// POST /api/itineraries/:id/days/:dayId/items
router.post('/:id/days/:dayId/items', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.post_id_days__dayId_items_11(req, res, next)));;

// PATCH /api/itineraries/:id/days/:dayId/items/:itemId
router.patch('/:id/days/:dayId/items/:itemId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.patch_id_days__dayId_items__itemId_12(req, res, next)));;

// DELETE /api/itineraries/:id/days/:dayId/items/:itemId
router.delete('/:id/days/:dayId/items/:itemId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.delete_id_days__dayId_items__itemId_13(req, res, next)));

// ── DAY REORDER (Drag & Drop) ──

// PUT /api/itineraries/:id/days/reorder — accepts { day_ids: [uuid, uuid, ...] } in desired order
router.put('/:id/days/reorder', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler((req, res, next) => itinerariesController.put_id_days_reorder_14(req, res, next)));

export default router;
