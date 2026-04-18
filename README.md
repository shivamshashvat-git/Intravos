# Intravos

A multi-tenant Travel Agency Operating System for the Indian market.
Built for medium-to-large travel agencies.

## What it does
Manages the full trip lifecycle:
Lead → Customer → Quotation → Invoice → Booking → Itinerary → Visa

Includes: GST-compliant invoicing, group traveler manifests,
INR formatting, WhatsApp communication logging, and a
B2B marketplace layer.

## Project Structure

```text
src/              # Frontend Application (FSD Architecture)
├── app/          # App setup (App.tsx, main.tsx, routing)
├── core/         # Critical config, auth, and base providers
├── features/     # Modulized business features (CRM, Finance, etc.)
└── shared/       # Cross-feature components, types, and library code

backend/          # Node.js Backend API
└── domains/      # Business domain logic (Controllers, Services)

supabase/         # Database & Serverless Infrastructure
└── migrations/   # Atomic, timestamped SQL schema history

frontend/         # (Future) Marketing Site Placeholder
```
