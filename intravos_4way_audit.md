# Intravos 4-Way Project Audit

> **Generated**: 2026-04-19 08:30 IST  
> **Methodology**: Grep-based cross-reference of `schema_reference.sql`, `/backend/**/*.js`, `/src/**/*.{ts,tsx}`  
> **Live DB Access**: NOT AVAILABLE (`psql` and `supabase` CLI not installed). All `in_live_db` = UNKNOWN.  
> **Schema naming**: The schema uses **snake_case** throughout (e.g. `lead_followups`, `calendar_events`, `markup_presets`). No compact-form names (e.g. `leadfollowups`) exist anywhere in the codebase.

---

## PART 1: FULL 4-WAY MATRIX

### Core / Auth

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Core | tenants | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | Heavily referenced across every domain | auth.js, subscription.js, admin.service.js, tenants.service.js, billing.service.js, +17 more | settingsService.ts |
| Core | users | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | Auth identity + RBAC | auth.service.js, user.service.js, admin.service.js, +10 more | settingsService.ts, CreateTaskDrawer.tsx, LeadsPage.tsx, +2 more |
| Core | plans | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P1 | Subscription plan catalog | tenants.service.js, billing.service.js | BookingDetailPage.tsx |
| Core | announcements | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | Backend only; no frontend screen | admin.service.js, announcements.service.js | — |
| Core | announcement_dismissals | table | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Schema only; zero code references | — | — |
| Core | auth_tenant_id() | rpc | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Utility function for RLS; not called from app code | — | — |
| Core | is_super_admin() | rpc | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Utility function for RLS; not called from app code | — | — |
| Core | auth.users → public.users sync trigger | trigger | NO | UNKNOWN | NO | NO | BROKEN_OR_MISMATCHED | P1 | No trigger defined in schema. Backend manages user sync manually via auth.service.js | — | — |
| Core | updated_at auto-update triggers | trigger | NO | UNKNOWN | NO | NO | BROKEN_OR_MISMATCHED | P2 | No `moddatetime` or trigger defined. Backend sets `updated_at` manually in service code | — | — |

### CRM

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| CRM | customers | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | | customer.service.js, engagement.service.js, +6 more | TrashPanel.tsx, EditCustomerDrawer.tsx, LeadDetailPage.tsx |
| CRM | associated_travelers | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | Backend wired; frontend displays via API | customer.service.js | — |
| CRM | leads | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | | lead.service.js, followup.service.js, IvoBotService.js, +15 more | TrashPanel.tsx, CreateTaskDrawer.tsx |
| CRM | lead_notes | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | Served via lead controller, displayed inline on LeadDetail | leads.controller.js, lead.service.js, seedService.js | — |
| CRM | lead_followups | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | followup.service.js, calendar.service.js, dashboard.service.js, softDelete.js | — |
| CRM | lead_attachments | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | leads.controller.js, softDelete.js | — |
| CRM | lead_documents | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | leads.controller.js, softDelete.js | — |
| CRM | lead_communications | table | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Schema only; zero code references | — | — |
| CRM | post_trip_feedback | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | feedback.service.js | — |
| CRM | referrals | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | referral.service.js, admin.service.js | — |
| CRM | client_health | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | clientHealth.js | — |
| CRM | customer_health_cache | table | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Schema only; zero code references | — | — |
| CRM | customer_merge_logs | table | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Schema only; zero code references | — | — |
| CRM | engagement_log | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | engagement.service.js, leads.controller.js | — |
| CRM | message_templates | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | engagement.service.js, messageService.js | — |

### Finance

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Finance | quotations | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | | quotation.service.js, softDelete.js, +7 more | TrashPanel.tsx |
| Finance | quotation_items | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | quotation.service.js, seedService.js, demoService.js | — |
| Finance | invoices | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | | invoice.service.js, payment.service.js, softDelete.js, +10 more | TrashPanel.tsx |
| Finance | invoice_items | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | invoice.service.js, seedService.js, demoService.js | — |
| Finance | payment_transactions | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | payment.service.js, clientHealth.js, cronService.js, +3 more | — |
| Finance | expenses | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | expense.service.js, softDelete.js, seedService.js | — |
| Finance | expense_categories | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | expense.service.js, softDelete.js | — |
| Finance | vendor_ledger | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | vendor-ledger.service.js, supplier.service.js, softDelete.js | — |
| Finance | markup_presets | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P1 | | markup.service.js, softDelete.js, seedService.js | TrashPanel.tsx, useMarkupPresets.ts |
| Finance | bank_accounts | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | tenants.service.js, payment.service.js, expense.service.js | — |
| Finance | coupons | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | Super Admin feature | admin.service.js, billing.service.js | — |
| Finance | coupon_usage_logs | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | admin.service.js | — |
| Finance | financial_audit_log | table | **NO** | UNKNOWN | **YES** | NO | **BROKEN_OR_MISMATCHED** | **P0** | **Backend references table that does not exist in schema** | financialAudit.js | — |

### Operations

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Ops | bookings | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | | booking.service.js, cancellation.service.js, IvoBotService.js, +13 more | CreateTaskDrawer.tsx, LeadDetailPage.tsx |
| Ops | booking_services | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | booking.service.js, voucher.service.js, payment.service.js | — |
| Ops | itineraries | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | | itinerary.service.js, softDelete.js, master_asset.service.js, +5 more | useKnowledgeBank.ts |
| Ops | itinerary_days | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | itinerary.service.js, master_asset.service.js, softDelete.js | — |
| Ops | itinerary_items | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | itinerary.service.js, master_asset.service.js, softDelete.js | — |
| Ops | visa_tracking | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | visa.service.js, calendar.service.js, softDelete.js, +4 more | — |
| Ops | visa_documents | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | Only demoService references it | demoService.js | — |
| Ops | travel_insurance_policies | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | insurance.service.js | — |
| Ops | cancellations | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | cancellation.service.js, softDelete.js | — |
| Ops | tasks | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | | tasks.service.js, taskAutomation.js, calendar.service.js, +4 more | — |
| Ops | calendar_events | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | calendar.service.js | — |
| Ops | documents | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P1 | | document.service.js, softDelete.js, master_asset.service.js | CustomerDetailPage.tsx, BookingDetailPage.tsx |
| Ops | vouchers | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | voucher.service.js, softDelete.js | — |
| Ops | group_booking_members | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | group-booking.service.js, softDelete.js | — |
| Ops | miscellaneous_services | table | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Schema only; zero code references | — | — |
| Ops | get_booking_hub | rpc | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P0 | Critical single-fetch RPC for Booking Hub | booking.service.js | — |

### Communication

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Comm | notifications | table | YES | UNKNOWN | YES | YES | CODED_NOT_DEPLOYED | P0 | | notifications.service.js, IvoBotService.js, +6 more | useNotifications.ts |
| Comm | workspace_messages | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | workspace.service.js | — |
| Comm | push_subscriptions | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | pushService.js | — |

### System / Admin

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| System | activity_logs | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | leads.controller.js, customer.service.js, trash.service.js, BaseService.js, quotation.service.js | — |
| System | dashboard_stats_cache | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | | cronService.js, tenants.service.js | — |
| System | import_logs | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | import.service.js | — |
| System | master_assets | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | master_asset.service.js | — |
| System | security_audit_logs | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | Sudo mode audit logging | sudo.js | — |
| System | tenant_settings | table | YES | UNKNOWN | NO | NO | PLANNED_ONLY | P3 | Schema only; zero code references | — | — |
| System | support_tickets | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | admin.service.js, support.service.js, softDelete.js | — |
| System | ticket_replies | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | support.service.js | — |
| System | sales_inquiries | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | sales.service.js | — |
| System | sales_requests | table | **NO** | UNKNOWN | **YES** | NO | **BROKEN_OR_MISMATCHED** | **P0** | **Backend references table not in schema. Conflicts with sales_inquiries.** | admin.service.js, admin.controller.js, admin.routes.js, tenants.routes.js | — |
| System | v_trash_items | view | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | Only covers leads, customers, quotations. Backend TRASH_TABLES supports 24 tables. | trash.service.js | — |

### Platform Governance

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Platform | platform_changelog | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | admin.service.js, changelog.js, tenants.service.js | — |
| Platform | platform_invoices | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | Super Admin billing | admin.service.js | — |
| Platform | platform_payments | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | Super Admin billing | admin.service.js | — |
| Platform | platform_prospects | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | Super Admin CRM | admin.service.js | — |
| Platform | platform_settings | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P2 | | admin.service.js, platformSettings.js | — |
| Platform | impersonation_sessions | table | YES | UNKNOWN | YES | NO | CODED_NOT_DEPLOYED | P1 | Critical for support impersonation | admin.service.js, auth.js | — |

### Marketplace (DEFERRED)

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Marketplace | suppliers | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | Routes commented out in routes/index.js | supplier.service.js, softDelete.js | — |
| Marketplace | agents_directory | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | directory.service.js, analytics.service.js, softDelete.js | — |
| Marketplace | offers | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | offer.service.js, softDelete.js | — |
| Marketplace | resource_hub_links | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | resources.service.js, softDelete.js | — |
| Marketplace | vendor_rate_cards | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | directory.service.js, softDelete.js | — |
| Marketplace | network_connections | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | network.service.js | — |
| Marketplace | network_feed_posts | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | network.service.js | — |
| Marketplace | network_feed_comments | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | network.service.js | — |
| Marketplace | network_feed_reactions | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | network.service.js | — |
| Marketplace | network_members | table | YES | UNKNOWN | NO | NO | DEFERRED | P3 | Schema only | — | — |
| Marketplace | network_messages | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | network.service.js | — |
| Marketplace | network_opportunities | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | network.service.js | — |
| Marketplace | network_post_quality_ratings | table | YES | UNKNOWN | YES | NO | DEFERRED | P3 | | network.service.js | — |

### DB Infrastructure

| module | entity_or_feature | type | in_schema_file | in_live_db | backend_wired | frontend_wired | status | priority | notes | exact_backend_files | exact_frontend_files |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| Infra | find_duplicate_phones | rpc | **NO** | UNKNOWN | **YES** | NO | **BROKEN_OR_MISMATCHED** | **P1** | IvoBot calls this RPC but it is not defined in schema | IvoBotService.js | — |
| Infra | get_monthly_pnl | rpc | **NO** | UNKNOWN | **YES** | NO | **BROKEN_OR_MISMATCHED** | **P1** | Analytics calls this RPC but it is not defined in schema | analytics.service.js | — |
| Infra | get_tenant_storage_size | rpc | **NO** | UNKNOWN | **YES** | NO | **BROKEN_OR_MISMATCHED** | **P2** | Cron calls this RPC but it is not defined in schema | cronService.js | — |
| Infra | RLS policy coverage | policy | PARTIAL | UNKNOWN | N/A | N/A | **BROKEN_OR_MISMATCHED** | **P1** | Only 13 of 78 tables have explicit ENABLE RLS. Others rely on DO-loop but coverage is unclear | — | — |

---

## PART 2: ACTION MATRIX (Filtered: BROKEN_OR_MISMATCHED, UNKNOWN DB, or high-risk items)

| # | entity | type | status | in_schema | in_live_db | backend | frontend | risk | action_needed |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | financial_audit_log | table | BROKEN_OR_MISMATCHED | NO | UNKNOWN | YES | NO | **CRITICAL** | Backend writes to non-existent table. Add to schema or remove backend reference. |
| 2 | sales_requests | table | BROKEN_OR_MISMATCHED | NO | UNKNOWN | YES | NO | **CRITICAL** | Backend references non-existent table. Schema has `sales_inquiries` instead. Naming collision. |
| 3 | find_duplicate_phones | rpc | BROKEN_OR_MISMATCHED | NO | UNKNOWN | YES | NO | **HIGH** | IvoBot calls undefined RPC. Will fail silently every 2 hours. |
| 4 | get_monthly_pnl | rpc | BROKEN_OR_MISMATCHED | NO | UNKNOWN | YES | NO | **HIGH** | Analytics P&L endpoint calls undefined RPC. Will crash on use. |
| 5 | get_tenant_storage_size | rpc | BROKEN_OR_MISMATCHED | NO | UNKNOWN | YES | NO | **MEDIUM** | Cron storage calculation fails silently. |
| 6 | auth.users sync trigger | trigger | BROKEN_OR_MISMATCHED | NO | UNKNOWN | NO | NO | **MEDIUM** | No automated sync between Supabase auth.users and public.users. Backend handles manually. |
| 7 | updated_at triggers | trigger | BROKEN_OR_MISMATCHED | NO | UNKNOWN | NO | NO | **LOW** | No DB-level auto-update. Backend sets manually. Acceptable but fragile. |
| 8 | RLS policy coverage | policy | BROKEN_OR_MISMATCHED | PARTIAL | UNKNOWN | N/A | N/A | **HIGH** | Only 13/78 tables have confirmed ENABLE RLS. Potential data leakage. |
| 9 | v_trash_items | view | CODED_NOT_DEPLOYED | YES | UNKNOWN | YES | NO | **MEDIUM** | View only covers 3 tables. Backend supports 24. View is stale. |
| 10 | announcement_dismissals | table | PLANNED_ONLY | YES | UNKNOWN | NO | NO | LOW | Dead schema weight. |
| 11 | lead_communications | table | PLANNED_ONLY | YES | UNKNOWN | NO | NO | LOW | Dead schema weight. |
| 12 | customer_health_cache | table | PLANNED_ONLY | YES | UNKNOWN | NO | NO | LOW | Dead schema weight. |
| 13 | customer_merge_logs | table | PLANNED_ONLY | YES | UNKNOWN | NO | NO | LOW | Dead schema weight. |
| 14 | tenant_settings | table | PLANNED_ONLY | YES | UNKNOWN | NO | NO | LOW | Dead schema weight. |
| 15 | miscellaneous_services | table | PLANNED_ONLY | YES | UNKNOWN | NO | NO | LOW | Dead schema weight. |
| 16 | network_members | table | DEFERRED | YES | UNKNOWN | NO | NO | LOW | Marketplace deferred. |

---

## PART 3: SUMMARY

### Status Counts

| Status | Count |
|:---|:---|
| CODED_NOT_DEPLOYED | 57 |
| DEFERRED | 13 |
| PLANNED_ONLY | 6 |
| BROKEN_OR_MISMATCHED | 8 |

> **Note**: Zero items are confirmed LIVE because there is no live DB access to verify. Everything that would otherwise qualify as LIVE is conservatively marked CODED_NOT_DEPLOYED.

### Top 15 Highest-Priority Blockers

| # | Entity | Type | Why it's a blocker |
|:---|:---|:---|:---|
| 1 | `financial_audit_log` | table | Backend `financialAudit.js` inserts to a table that doesn't exist in schema. All price-change auditing silently fails. |
| 2 | `sales_requests` | table | Backend `admin.service.js` reads/writes `sales_requests` but schema only has `sales_inquiries`. Super Admin sales tracking is broken. |
| 3 | `find_duplicate_phones` | rpc | IvoBot calls `supabase.rpc('find_duplicate_phones')` every 2 hours. Undefined in schema. Fails silently. |
| 4 | `get_monthly_pnl` | rpc | `analytics.service.js` calls this RPC for profit/loss reports. Undefined in schema. Finance analytics is broken. |
| 5 | RLS coverage | policy | Only 13 of 78 tables have explicit `ENABLE ROW LEVEL SECURITY`. Remaining 65 tables may be open to cross-tenant reads if service role key leaks. |
| 6 | `get_tenant_storage_size` | rpc | Daily cron attempts storage quota calculation via undefined RPC. Fails silently. |
| 7 | `v_trash_items` view | view | SQL view only unions `leads`, `customers`, `quotations`. Backend `TRASH_TABLES` supports 24 tables. Trash UI may show incomplete results. |
| 8 | `auth.users` sync trigger | trigger | No trigger to auto-create a `public.users` row when a user signs up via Supabase Auth. Backend `auth.service.js` handles it manually but this is fragile. |
| 9 | `in_live_db` = UNKNOWN for ALL tables | infra | Cannot confirm any table actually exists in production. Need `psql` access or Supabase dashboard verification for definitive LIVE status. |
| 10 | `updated_at` triggers | trigger | No database-level auto-update trigger. Backend manually sets `updated_at` on every `.update()` call. If a direct SQL update bypasses the app, timestamps won't update. |
| 11 | 6 PLANNED_ONLY tables | tables | `announcement_dismissals`, `lead_communications`, `customer_health_cache`, `customer_merge_logs`, `tenant_settings`, `miscellaneous_services` exist in schema but have zero code references. Dead weight or premature additions. |
| 12 | Marketplace route disabled | feature | `routes/index.js` has `// router.use('/marketplace', marketplaceRoutes);` commented out. 13 tables + full service layer exist but are unreachable. |
| 13 | Frontend uses mixed data patterns | arch | Some pages call Supabase directly (`LeadsPage`, `BookingsPage`), others use `apiClient` → backend. Inconsistent data access pattern. |
| 14 | Frontend indirection | arch | Many "backend_wired=YES, frontend_wired=NO" items (e.g. `lead_followups`) are actually surfaced in frontend via API calls to the backend. The frontend doesn't reference table names directly; it calls API endpoints. This is correct architecture, not a gap. |
| 15 | `security_audit_logs` | table | Only referenced in `sudo.js` middleware. If this table doesn't exist in live DB, every Sudo action will fail to log (non-fatal but audit gap). |
