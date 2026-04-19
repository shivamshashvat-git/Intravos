import expensesController from './expenses.controller.js';
import express from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/categories', authenticate, requireStaff(), requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.listCategories(req, res, next)));

router.post('/categories', authenticate, requireAdmin(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.createCategory(req, res, next)));

router.patch('/categories/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.updateCategory(req, res, next)));

router.delete('/categories/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.deleteCategory(req, res, next)));

router.get('/', authenticate, requireStaff(), requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.listExpenses(req, res, next)));

router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.recordExpense(req, res, next)));

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.updateExpense(req, res, next)));

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('expenses'), asyncHandler((req, res, next) => expensesController.deleteExpense(req, res, next)));

export default router;
