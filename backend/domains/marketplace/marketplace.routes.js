import { Router } from 'express';

import suppliersRoutes from './suppliers/suppliers.routes.js';
import directoryRoutes from './directory/directory.routes.js';
import networkRoutes from './network/network.routes.js';
import offersRoutes from './offers/offers.routes.js';
import resourcesRoutes from './resources/resources.routes.js';

const router = Router();

router.use('/suppliers', suppliersRoutes);
router.use('/directory', directoryRoutes);
router.use('/network', networkRoutes);
router.use('/offers', offersRoutes);
router.use('/resources', resourcesRoutes);

export default router;
