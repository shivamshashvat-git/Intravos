# Intravos V1 Integration Map

This document maps the data flow and triggers across the 12 core modules of Intravos.

## 1. CRM Flow (Lead Acquisition)

### Lead → Customer
- **Trigger**: "Convert to Customer" action in Lead Detail.
- **Data Flow**: `leads.customer_name` -> `customers.name`, `leads.customer_phone` -> `customers.phone`.
- **Constraint**: check for existing customer via `phone` before creation.

### Lead → Communication Log
- **Trigger**: "Log Call" or "Send WhatsApp" in Lead Detail.
- **Table**: `lead_communications`.
- **Integration**: Updates `leads.updated_at` and `customers.last_contacted_at`.

## 2. Finance Flow (Proposal & Billing)

### Lead → Quotation
- **Trigger**: "Create Quote" from Lead context.
- **Data Flow**: Lead destination and dates snapshotted to `quotations.destination`, `start_date`, `end_date`.
- **Status Change**: `leads.status` -> `quote_sent` upon quotation creation.

### Quotation → Invoice
- **Trigger**: "Accept & Generate Invoice" in Quote Detail.
- **Data Flow**: Copies `quotation_items` to `invoice_items`.
- **Logic**: Applies current Agency GSTIN and Branding at point of creation.

## 3. Operations Flow (Confirmation & Fulfillment)

### Lead/Quote → Booking
- **Trigger**: "Confirm Booking" from Lead or Accepted Quote.
- **Data Flow**: `selling_price` mapped to `total_selling_price`.
- **Entity Link**: `bookings` references `lead_id`, `customer_id`, `invoice_id`.

### Booking → Itinerary
- **Trigger**: "Add Trip Plan" from Booking Detail.
- **Integration**: Itinerary metadata (title, destination) prefilled from Booking.
- **Public View**: Itinerary `share_token` generated for client access.

## 4. Operational Control (Tasks & Visas)

### Lead → Visa Tracking
- **Trigger**: "Add Visa Application" in Lead/Booking tabs.
- **Life Cycle**: Visa tracking starts in Lead (Sales phase) and carries through to Booking (Operations phase).

### Automation Triggers
- **Task Creation**: New Lead assigned -> Task for "Initial Contact" created for owner.
- **Notification**: Invoice marked Paid -> Notification to Bookings team for fulfillment.
- **Dashboard**: All metrics derived from live `leads`, `invoices`, and `payment_transactions` via stats cache.
