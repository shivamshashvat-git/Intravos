# Intravos V1 Migration Index

This document provides a chronological index of all schema migrations for Intravos V1.

## Domain Groups

| Group | Description | Status |
| :--- | :--- | :--- |
| **G1** | Auth & Tenants | Stable |
| **G2** | CRM (Leads, Notes, Comms) | Requires Alignment |
| **G3** | Customers & Travelers | Stable |
| **G4** | Finance (Quotes, Invoices) | Stable |
| **G5** | Bookings | Requires Pax Columns |
| **G6** | Itineraries | Stable |
| **G7** | Visa Tracking | High Fidelity |
| **G8** | Tasks & Notifications | Unified |
| **G9** | Settings & Dashboard | Unified |
| **G10** | RLS Policies | Global |

## Migration Ledger

| Filename | Domain | Description | Status |
| :--- | :--- | :--- | :--- |
| `00-base-enums-and-extensions.sql` | G1 | Defines `user_role`, `lead_source`, and extensions. | Active |
| `01-super-admin-hud.sql` | G1 | Platform-wide tracking (Plans, Prospects, Audits). | Active |
| `02-tenant-foundation.sql` | G1 | Core `tenants` and `users` tables. | Active |
| `03-tenant-crm.sql` | G2/G3 | `leads`, `customers`, `followups`, `notes`. | Superseded by G2 Alignment |
| `04-tenant-finance.sql` | G4 | `quotations`, `invoices`, `items`. | Active |
| `05-tenant-operations.sql` | G3 | `associated_travelers` and base operations. | Active |
| `06-global-marketplace.sql` | - | Supplier directory and public catalog logic. | Active |
| `07-security-rls.sql` | G10 | Global RLS framework and tenant isolation logic. | Active |
| `08-schema-fixes-v1.sql` | G1/G2 | Lead Status alignment and GSTIN consolidation. | Active |
| `09-payment-transactions.sql` | G4 | Detailed ledger for invoice payments. | Active |
| `10-bookings-and-visas.sql` | G5/G7 | Primary `bookings` and initial visa table. | Superseded by 12 |
| `11-itineraries.sql` | G6 | Multi-tier trip builder (Itinerary/Day/Item). | Active |
| `12-visa-system.sql` | G7 | Dedicated visa tracking system with doc custody. | Active |
| `13-operations-tasks.sql` | G8 | Task lifecycle and in-app notifications. | Active |
| `14-bank-accounts.sql` | G9 | Financial liquidity nodes for agency settings. | Active |
| `15-dashboard-cache.sql` | G9 | High-velocity stats cache for executive HUD. | Active |
| `16-v1-alignment-fixes.sql` | ALL | (PENDING) Final alignment of pax, pinned notes, and comms. | Planned |

---
**Reference**: Migrations 00-08 reside in `backend/schema/`, while 09-15 are in `database/migrations/`. 
For V1 production, these are consolidated into `v1_consolidated_reference.sql`.
