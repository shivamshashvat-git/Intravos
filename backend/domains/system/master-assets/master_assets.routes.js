import express from 'express';
import MasterAssetsController from './master_assets.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { routeCache } from '../../../core/middleware/cacheMiddleware.js';

const router = express.Router();

router.use(authenticate, requireAdmin(), requireFeature('master_assets'));

router.get('/', routeCache(600), asyncHandler((req, res, next) => MasterAssetsController.get__0(req, res, next)));
router.get('/:id', routeCache(600), asyncHandler((req, res, next) => MasterAssetsController.get_id_1(req, res, next)));
router.post('/', asyncHandler((req, res, next) => MasterAssetsController.post__2(req, res, next)));
router.post('/import', asyncHandler((req, res, next) => MasterAssetsController.post_import_3(req, res, next)));
router.post('/:id/pull', asyncHandler((req, res, next) => MasterAssetsController.post_id_pull_4(req, res, next)));
router.patch('/:id', asyncHandler((req, res, next) => MasterAssetsController.patch_id_5(req, res, next)));
router.delete('/:id', asyncHandler((req, res, next) => MasterAssetsController.delete_id_6(req, res, next)));

export default router;
