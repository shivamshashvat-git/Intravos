# Intravos Endpoints Readiness Report
**Status**: READ-ONLY ARCHITECTURAL AUDIT COMPLETE

## 1. Fully Implemented (Ready for Frontend)

These endpoints have fully verified controllers and services with complete database persistence logic.

| Method | Route Path | Controller Method | Service Used | Status | Safe for Integration |
|:---|:---|:---|:---|:---|:---|
| POST | `/api/v1/auth/login` | `login` | `authService` | ✅ Full | YES |
| POST | `/api/v1/auth/register` | `register` | `tenantService` | ✅ Full | YES |
| GET | `/api/v1/auth/me` | `getMe` | `userService` | ✅ Full | YES |
| GET | `/api/v1/crm/leads` | `listLeads` | `leadService` | ✅ Full | YES |
| GET | `/api/v1/crm/leads/:id` | `getLeadById` | `leadService` | ✅ Full | YES |
| POST | `/api/v1/crm/leads` | `createLead` | `leadService` | ✅ Full | YES |
| PATCH | `/api/v1/crm/leads/:id` | `updateLead` | `leadService` | ✅ Full | YES |
| GET | `/api/v1/crm/customers` | `listCustomers` | `customerService` | ✅ Full | YES |
| GET | `/api/v1/crm/customers/:id` | `getCustomerById` | `customerService` | ✅ Full | YES |
| POST | `/api/v1/crm/customers` | `createCustomer` | `customerService` | ✅ Full | YES |
| GET | `/api/v1/finance/quotations` | `listQuotations` | `quotationService` | ✅ Full | YES |
| POST | `/api/v1/finance/quotations` | `createQuotation` | `quotationService` | ✅ Full | YES |
| POST | `/api/v1/finance/quotations/:id/revise` | `reviseQuotation` | `quotationService` | ✅ Full | YES |
| POST | `/api/v1/finance/quotations/:id/convert-to-invoice` | `convertToInvoice` | `invoiceService` | ✅ Full | YES |
| GET | `/api/v1/operations/bookings` | `listBookings` | `bookingService` | ✅ Full | YES |
| GET | `/api/v1/operations/bookings/:id/hub` | `getBookingHub` | `bookingService` | ✅ Full | YES |
| GET | `/api/v1/operations/bookings/pnr-tracker` | `getPnrTracker` | `bookingService` | ✅ Full | YES |

---

## 2. Partially Implemented (Requires Provider/Template Verification)

Logic is present, but external dependencies (Storage, PDF Engine) might need localized environment configuration.

| Method | Route Path | Controller Method | Service Used | Status | Safe for Integration |
|:---|:---|:---|:---|:---|:---|
| GET | `/api/v1/crm/leads/:id/pdf` | `getLeadBookingPdf` | `pdfEngine` | ⚠️ Alpha | Conditional (Templates) |
| GET | `/api/v1/finance/quotations/:id/pdf` | `getQuotationPdf` | `pdfEngine` | ⚠️ Alpha | Conditional (Templates) |
| GET | `/api/v1/operations/bookings/:id/services/:sid/pdf` | `getServiceVoucherPdf` | `pdfEngine` | ⚠️ Alpha | Conditional (Templates) |
| POST | `/api/v1/operations/bookings/:id/services` | `addBookingService` | `bookingService` | ⚠️ Beta | YES (Financial sync needed) |

---

## 3. Stubbed or Returning 501 / Placeholder

These endpoints have been renamed/bound to prevent crashes but currently have no backend logic.

| Method | Route Path | Controller Method | Status | Reason | Safe for Integration |
|:---|:---|:---|:---|:---|:---|
| POST | `/api/v1/crm/leads/:id/documents` | `uploadLeadDocument` | 🚫 501 | Storage Provider missing | NO |
| GET | `/api/v1/crm/leads/:id/share-urls` | `getLeadShareUrls` | 🚫 501 | Logic not ported | NO |
| POST | `/api/v1/operations/bookings/:id/cancel` | `cancelBooking` | 🚫 501 | Complex workflow missing | NO |
| GET | `/api/v1/operations/bookings/:id/travel-pack/pdf` | `getTravelPackPdf` | 🚫 501 | Multi-PDF merging missing | NO |
| POST | `/api/v1/crm/customers/merge` | `mergeCustomers` | 🚫 501 | Logic currently stuck in routes | NO |

---

## 🚀 Recommended First Frontend Slice: "CRM Core (Leads & Follow-ups)"

**Why?**
1. **Tooling Readiness**: `leads` and `customers` services are the most mature in the codebase.
2. **Zero Dependency**: Does not require PDF generation or complex Cloud Storage (like Finance/Operations).
3. **High Impact**: Enables the primary user (Travel Agent) to start entering and tracking business immediately.

**Suggested Scope**:
- Lead Entry form (Manual).
- Lead Dashboard (Listing + Filters).
- Lead Detail View (Basic sidebar/profile).
- Follow-up list (Simple "Due Today" list).
