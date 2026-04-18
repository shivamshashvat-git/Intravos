# Production Setup & Deployment Playbook

This document is the distilled guide for deploying Intravos safely.

## 1. Environment Requirements
Both development and production require exact `.env` files.

**Backend (`backend/.env`)**
```env
# Server
PORT=4000
NODE_ENV=production

# Supabase Auth/Access
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Providers (Optional depending on active modules)
RESEND_API_KEY=email_key
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=https://api.intravos.app/api/v1
```

## 2. Compiling the Database
You cannot just push `.sql` arbitrarily. The 7-schema layout has a strict order of operations:
1. From `backend/`, run `node scripts/compile-schema.js`.
2. This creates `compiled-schema.sql`.
3. Verify integrity using `node scripts/schema-audit.js`.
4. Deploy the monolithic SQL to Supabase SQL editor or via Supabase CLI.

## 3. Seed Execution (Post Launch)
Once the database exists:
Run the seed scripts directly to generate your master Super Admin and baseline parameters.
```bash
node schema/seeds/init-super-admin.js
```

## 4. Deploying The Frontend (Vite)
Because Intravos is a Vite SPA architecture, we rely purely on static hosting + edge CDN (unlike an SSR Next.js build).
1. `npm run build`
2. Push `dist/` to Vercel, Netlify, or AWS S3.
*Note: Due to client-side routing, ensure absolute fallback rules targeting `index.html` on your CDN*.

## 5. Deploying The Backend (Node/Express)
1. Hosted on reliable Node environments (Render, Railway, or EC2).
2. The server must support Chromium execution via the native Puppeteer Provider API.
3. Configure start command: `npm start` (which fires `node server.js`).
