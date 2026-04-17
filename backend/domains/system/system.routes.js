import { Router } from 'express';

import systemRoutes from './system/system.routes.js';
import usersRoutes from './users/users.routes.js';
import tenantsRoutes from './tenants/tenants.routes.js';
import adminRoutes from './admin/admin.routes.js';
import announcementsRoutes from './announcements/announcements.routes.js';
import trashRoutes from './trash/trash.routes.js';
import supportRoutes from './support/support.routes.js';
import notificationsRoutes from './notifications/notifications.routes.js';
import searchRoutes from './search/search.routes.js';
import uploadsRoutes from './uploads/uploads.routes.js';
import masterassetsRoutes from './master-assets/master_assets.routes.js';
import workspaceRoutes from './workspace/workspace.routes.js';
import importRoutes from './import/import.routes.js';

const router = Router();

router.use('/system', systemRoutes);
router.use('/users', usersRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/admin', adminRoutes);
router.use('/announcements', announcementsRoutes);
router.use('/trash', trashRoutes);
router.use('/support', supportRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/master-assets', masterassetsRoutes);
router.use('/workspace', workspaceRoutes);
router.use('/import', importRoutes);

export default router;
