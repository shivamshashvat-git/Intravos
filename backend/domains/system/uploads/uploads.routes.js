import uploadsController from './uploads.controller.js';
import express from 'express';
import multer from 'multer';
import config from '../../../core/config/index.js';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { resolveBucket  } from '../../../providers/storage/storage.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.post('/', authenticate, requireStaff(), requireWriteAccess, upload.single('file'), asyncHandler((req, res, next) => uploadsController.post__0(req, res, next)));;

export default router;
