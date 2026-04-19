import { Router } from 'express';

import bookingsRoutes from './bookings/bookings.routes.js';
import itinerariesRoutes from './itineraries/itineraries.routes.js';
import visaRoutes from './visa/visa.routes.js';
import tasksRoutes from './tasks/tasks.routes.js';
import vouchersRoutes from './vouchers/vouchers.routes.js';
import groupbookingsRoutes from './group-bookings/group-bookings.routes.js';
import cancellationsRoutes from './cancellations/cancellations.routes.js';
import miscServicesRoutes from './misc-services/misc-services.routes.js';
import insuranceRoutes from './insurance/insurance.routes.js';
import documentsRoutes from './documents/documents.routes.js';
import calendarRoutes from './calendar/calendar.routes.js';

const router = Router();

router.use('/bookings', bookingsRoutes);
router.use('/itineraries', itinerariesRoutes);
router.use('/visa', visaRoutes);
router.use('/tasks', tasksRoutes);
router.use('/vouchers', vouchersRoutes);
router.use('/group-members', groupbookingsRoutes); // User requested path
router.use('/cancellations', cancellationsRoutes);
router.use('/misc-services', miscServicesRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/documents', documentsRoutes);
router.use('/calendar', calendarRoutes);

export default router;
