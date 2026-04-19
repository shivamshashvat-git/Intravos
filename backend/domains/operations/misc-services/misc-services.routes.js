
import express from 'express';
import miscServicesController from './misc-services.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { validate } from '../../../core/middleware/validate.js';
import { miscServiceSchema, updateMiscServiceSchema } from './misc-services.schema.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('bookings'), asyncHandler(miscServicesController.listServices));
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(miscServiceSchema), asyncHandler(miscServicesController.createService));

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), validate(updateMiscServiceSchema), asyncHandler(miscServicesController.updateService));
router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('bookings'), asyncHandler(miscServicesController.deleteService));

export default router;
