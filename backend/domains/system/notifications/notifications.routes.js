import express from 'express';
import notificationController from './notifications.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.listNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

export default router;
