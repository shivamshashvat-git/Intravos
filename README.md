# INTRAVOS — Industrial B2B Travel OS

Intravos is a production-grade, multi-tenant SaaS ecosystem designed for mid-to-large scale travel agencies. It combines industrial CRM logic with a proprietary B2B Opportunity Marketplace and Predictive Business Intelligence.

---

## 🚀 Key Modules (The 5 Domains)

The backend natively drives these 5 pillars of travel agency operations:

1. **CRM**: Kanban-driven lead management, WhatsApp integration, and automated follow-ups.
2. **Operations**: Itinerary generators, document distribution, and booking life-cycles.
3. **Finance**: Multi-currency invoicing, GST-ready reporting, and supplier ledger reconciliation.
4. **Marketplace**: Peer-to-peer opportunity board for lead dispatch and destination expertise.
5. **System Governance**: Multi-tiered RBAC, cross-tenant RLS boundaries, and unified settings.

---

## 🛠 Tech Stack (Refactored)

**Frontend: The "Future-Proof" Core**
- React 19 + Vite (for ultra-fast HMR and building)
- Context-Free styling with Tailwind CSS v3/v4 & semantic OKLCH tokens
- Feature-Sliced Design Architecture `(src/features/[domain])`

**Backend: The Modular Monolith**
- Node.js (ESM), Express.
- 5x strictly-isolated Domain Routers protecting internal use-cases.
- Unified Master Utilities + Puppeteer Native PDF Engine.

**Database Ecosystem**
- Supabase (PostgreSQL 15) ensuring hard tenant isolation via Row Level Security (RLS).
- Completely decoupled, modular 7-tier database `schema/` deployment protocol.

---

## 📦 Getting Started

### Prerequisites
- Node.js > 20+
- Supabase Local/Hosted Account

### Installation
1. Clone the repository.
2. Initialize `.env` files in `/backend/` and `/frontend/` utilizing `.env.example`.
3. Install platform dependencies:
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```
4. Start both isolated servers:
   ```bash
   # Terminal 1 - The Monolith
   cd backend && npm run dev
   # Terminal 2 - The Studio
   cd frontend && npm run dev
   ```

---

## 🛡 Security & Structural Compliance

- **Universal RLS**: 100% database coverage ensuring absolute tenant isolation natively.
- **Enforced Subscription Gates**: The monolithic router natively rejects requests for deactivated entities.
- **The Janitor**: Automated 30-day trash purge for data hygiene and GDPR compliance.

---

## 📜 Canonical Documentation

- [**System Architecture**](./docs/ARCHITECTURE.md) — How the modular monolith and UI align.
- [**Deployment Playbook**](./docs/SETUP_AND_DEPLOYMENT_GUIDE.md) — Launching to Production natively.

---
© 2026 Intravos Platform. Industrialized for the Future of Travel.
