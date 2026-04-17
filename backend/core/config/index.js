import dotenv from 'dotenv';
dotenv.config();

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export default {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  cors: { origins: corsOrigins.length ? corsOrigins : ['http://localhost:3000'] },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  cron: {
    secret: process.env.CRON_SECRET || 'dev-cron-secret-change-me',
  },
  storage: {
    defaultBucket: process.env.STORAGE_BUCKET || process.env.STORAGE_BUCKET_UPLOADS || 'iv-uploads',
    buckets: {
      uploads: process.env.STORAGE_BUCKET_UPLOADS || process.env.STORAGE_BUCKET || 'iv-uploads',
      screenshots: process.env.STORAGE_BUCKET_SCREENSHOTS || 'iv-screenshots',
      attachments: process.env.STORAGE_BUCKET_ATTACHMENTS || 'iv-attachments',
      documents: process.env.STORAGE_BUCKET_DOCUMENTS || 'iv-documents',
      offers: process.env.STORAGE_BUCKET_OFFERS || 'iv-offers',
      logos: process.env.STORAGE_BUCKET_LOGOS || 'iv-logos',
      rateCards: process.env.STORAGE_BUCKET_RATE_CARDS || 'iv-rate-cards',
      pdfs: process.env.STORAGE_BUCKET_PDFS || 'iv-pdfs',
      receipts: process.env.STORAGE_BUCKET_RECEIPTS || 'iv-receipts',
    },
  },
};
