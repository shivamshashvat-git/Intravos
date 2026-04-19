import express from 'express';
import dashboardController from './dashboard.controller.js';
import { authenticate, requireStaff } from '../../../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireStaff);

router.get('/', dashboardController.getDashboard);
router.post('/refresh', dashboardController.refreshDashboard);
router.get('/performance', dashboardController.getPerformance);
router.get('/top-performers', dashboardController.getTopPerformers);

export default router;
