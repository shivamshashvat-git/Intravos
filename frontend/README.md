# Intravos Frontend Architecture

Welcome to the Intravos Frontend ecosystem. This app is built on a **Vite + React 19** stack featuring ultra-fast Hot Module Replacement (HMR) and relies on a tailored **Feature-Sliced Design**.

## Directory Structure

The frontend mirrors the backend's strict 5-Domain Architecture. All feature-specific logic goes into `src/features/[domain]`, keeping global concerns isolated.

### `src/features/`
- **`crm/`**: Lead tracking, pipeline management, and client hub.
- **`operations/`**: Booking lifecycle, itineraries, tasks.
- **`finance/`**: Invoices, receipts, agency billing.
- **`marketplace/`**: Suppliers and network distribution.
- **`system/`**: App shell, unified dashboard, permissions, auth guards.

Inside a feature (e.g., `features/crm/`), structure as follows:
- `/components`: Specific to this feature
- `/api`: Slices targeting the backend domain API
- `/hooks`: Custom logic specific to CRM
- `index.js`: Exposes the feature to the rest of the app.

### `src/components/`
- **`ui/`**: Pure, dumb foundational components (buttons, dialogs, inputs). Radix primitives / shadcn code goes here.
- **`layouts/`**: Universal app wrappers (Sidebar, AuthenticatedLayout).

### `src/store/`
- Global Zustand stores (e.g., `useAuthStore.js`, `useTenantStore.js`).

### `src/services/`
- `api/`: Central configured Axios instance hooking into global Auth token injection.

## Styling Rules
Please DO NOT hardcode Hex codes. Use identical semantic `oklch` variables as defined in `tailwind.config.js`.

**Commands**
- `npm run dev` : Spawns development server.
- `npm run build` : Builds optimized generic distribution.
