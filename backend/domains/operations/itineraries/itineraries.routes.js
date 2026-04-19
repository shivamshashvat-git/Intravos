
import express from 'express';
import itinerariesController from './itineraries.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { validate } from '../../../core/middleware/validate.js';
import { 
  createItinerarySchema, 
  updateItinerarySchema, 
  createDaySchema, 
  updateDaySchema, 
  createItemSchema, 
  updateItemSchema,
  reorderItemsSchema
} from './itineraries.schema.js';

const router = express.Router();

/**
 * Itinerary Builder Routes — Industrialized
 */

// Itineraries (one per booking)
router.get('/booking/:bookingId', authenticate, requireStaff(), requireFeature('itineraries'), asyncHandler(itinerariesController.getBookingItinerary));
router.post('/booking/:bookingId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(createItinerarySchema), asyncHandler(itinerariesController.createBookingItinerary));

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(updateItinerarySchema), asyncHandler(itinerariesController.updateItinerary));

// Days
router.post('/:id/days', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(createDaySchema), asyncHandler(itinerariesController.addItineraryDay));
router.patch('/days/:dayId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(updateDaySchema), asyncHandler(itinerariesController.updateItineraryDay));
router.delete('/days/:dayId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler(itinerariesController.deleteItineraryDay));

// Items
router.post('/days/:dayId/items', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(createItemSchema), asyncHandler(itinerariesController.addItineraryItem));
router.patch('/items/:itemId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(updateItemSchema), asyncHandler(itinerariesController.updateItineraryItem));
router.delete('/items/:itemId', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), asyncHandler(itinerariesController.deleteItineraryItem));

// Flattened Industrialized Aliases (Module 5 verification requirement)
router.post('/itinerary-days/:dayId/items', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(createItemSchema), asyncHandler(itinerariesController.addItineraryItem));
router.patch('/itinerary-days/:dayId/reorder', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(reorderItemsSchema), asyncHandler(itinerariesController.reorderItineraryItems));

// Reorder Items
router.patch('/days/:dayId/reorder', authenticate, requireStaff(), requireWriteAccess, requireFeature('itineraries'), validate(reorderItemsSchema), asyncHandler(itinerariesController.reorderItineraryItems));

// PDF
router.post('/:id/pdf', authenticate, requireStaff(), requireFeature('itineraries'), asyncHandler(itinerariesController.generateItineraryPdf));

export default router;
