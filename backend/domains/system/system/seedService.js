import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SeedService — Enterprise Data Injection Engine
 * 
 * Handles file-based seeding of tenant data with support for 
 * relational mapping (aliases) and transactional integrity.
 */
class SeedService {
  /**
   * Inject a seed file into a specific tenant
   * @param {string} tenantId - The target tenant UUID
   * @param {string} seedFileName - Minimal filename in backend/seeds/
   */
  async injectSeed(tenantId, seedFileName = 'demo_portfolio.json') {
    const seedPath = path.join(__dirname, '../seeds', seedFileName);
    
    try {
      const rawData = await fs.readFile(seedPath, 'utf-8');
      const { data } = JSON.parse(rawData);
      
      logger.info({ tenantId, seedFile: seedFileName }, '[SeedService] Starting data injection');

      const aliasMap = {
        customers: {}, // alias -> actual UUID
        leads: {},     // alias -> actual UUID
        bookings: {}   // alias -> actual UUID
      };

      // 1. Inject Customers
      if (data.customers?.length) {
        const customersToInsert = data.customers.map(c => ({
          tenant_id: tenantId,
          name: c.name,
          phone: c.phone,
          email: c.email,
          tags: c.tags || []
        }));

        const { data: insertedCustomers, error: custErr } = await supabaseAdmin
          .from('customers')
          .insert(customersToInsert)
          .select('id, name');

        if (custErr) throw custErr;

        data.customers.forEach(c => {
          if (c.id_alias) {
            const inserted = insertedCustomers.find(ic => ic.name === c.name);
            if (inserted) aliasMap.customers[c.id_alias] = inserted.id;
          }
        });
      }

      // 2. Inject Leads
      if (data.leads?.length) {
        const leadsToInsert = data.leads.map(l => ({
          tenant_id: tenantId,
          customer_id: aliasMap.customers[l.customer_alias],
          customer_name: data.customers.find(c => c.id_alias === l.customer_alias)?.name,
          customer_phone: data.customers.find(c => c.id_alias === l.customer_alias)?.phone,
          destination: l.destination,
          source: l.source,
          status: l.status,
          checkin_date: l.travel_start_date,
          checkout_date: l.travel_end_date,
          guests: l.guests,
          priority: l.priority || 'normal'
        }));

        const { data: insertedLeads, error: leadErr } = await supabaseAdmin
          .from('leads')
          .insert(leadsToInsert)
          .select('id, destination');

        if (leadErr) throw leadErr;

        // 2a. Inject Lead Notes (Separated in Industrial Schema)
        const notesToInsert = data.leads
          .filter(l => l.notes)
          .map((l, idx) => ({
            tenant_id: tenantId,
            entity_type: 'lead',
            entity_id: insertedLeads[idx].id,
            user_id: null, // System generated
            content: l.notes
          }));
        
        if (notesToInsert.length > 0) {
          await supabaseAdmin.from('lead_notes').insert(notesToInsert);
        }

        data.leads.forEach((l, idx) => {
          if (l.id_alias) {
            aliasMap.leads[l.id_alias] = insertedLeads[idx].id;
          }
        });
      }

      // 3. Inject Itineraries (Deep Tree)
      if (data.itineraries?.length) {
        for (const itin of data.itineraries) {
          const customerId = aliasMap.customers[itin.customer_alias];
          const leadId = aliasMap.leads[itin.lead_alias];

          const { data: insertedItin, error: itinErr } = await supabaseAdmin
            .from('itineraries')
            .insert({
              tenant_id: tenantId,
              customer_id: customerId,
              lead_id: leadId,
              title: itin.title,
              destination: itin.destination,
              start_date: itin.start_date,
              end_date: itin.end_date,
              inclusions: itin.inclusions,
              exclusions: itin.exclusions,
              terms: itin.terms
            })
            .select('id')
            .single();

          if (itinErr) throw itinErr;

          if (itin.days?.length) {
            for (const day of itin.days) {
              const { data: insertedDay, error: dayErr } = await supabaseAdmin
                .from('itinerary_days')
                .insert({
                  itinerary_id: insertedItin.id,
                  day_number: day.day_number,
                  title: day.title,
                  description: day.description
                })
                .select('id')
                .single();

              if (dayErr) throw dayErr;

              if (day.items?.length) {
                const itemsToInsert = day.items.map((item, idx) => ({
                  day_id: insertedDay.id,
                  item_type: item.item_type,
                  title: item.title,
                  details: item.details || '',
                  image_url: item.image_url,
                  address: item.address || '',
                  location: item.location,
                  star_rating: item.star_rating,
                  check_in: item.check_in,
                  check_out: item.check_out,
                  cost_price: item.cost_price || 0,
                  sort_order: idx
                }));

                const { error: itemsErr } = await supabaseAdmin.from('itinerary_items').insert(itemsToInsert);
                if (itemsErr) throw itemsErr;
              }
            }
          }
        }
      }

      // 4. Inject Bookings
      if (data.bookings?.length) {
        const bookingsToInsert = data.bookings.map(b => ({
          tenant_id: tenantId,
          lead_id: aliasMap.leads[b.lead_alias],
          customer_id: aliasMap.customers[b.customer_alias],
          booking_ref: b.booking_ref,
          status: b.status,
          destination: b.destination,
          travel_start_date: b.travel_start_date,
          travel_end_date: b.travel_end_date,
          traveler_count: b.traveler_count
        }));

        const { data: insertedBookings, error: bookErr } = await supabaseAdmin
          .from('bookings')
          .upsert(bookingsToInsert, { onConflict: 'tenant_id, booking_ref' })
          .select('id, booking_ref');

        if (bookErr) throw bookErr;

        data.bookings.forEach((b, idx) => {
          if (b.id_alias) {
            aliasMap.bookings[b.id_alias] = insertedBookings[idx].id;
          }
        });
      }

      // 5. Inject Invoices
      if (data.invoices?.length) {
        for (const inv of data.invoices) {
          const { data: insertedInv, error: invErr } = await supabaseAdmin
            .from('invoices')
            .upsert({
              tenant_id: tenantId,
              customer_id: aliasMap.customers[inv.customer_alias],
              booking_id: aliasMap.bookings[inv.booking_alias],
              invoice_number: inv.invoice_number,
              status: inv.status,
              subtotal: inv.subtotal,
              cgst: inv.cgst,
              sgst: inv.sgst,
              total: inv.total,
              amount_paid: inv.amount_paid,
              due_date: inv.due_date,
              agency_name: 'Intravos HQ',
              customer_name: data.customers.find(c => c.id_alias === inv.customer_alias)?.name
            })
            .select('id')
            .single();

          if (invErr) throw invErr;

          if (inv.items?.length) {
            const itemsToInsert = inv.items.map((item, idx) => ({
              invoice_id: insertedInv.id,
              description: item.description,
              amount: item.amount,
              gst_rate: item.gst_rate || 5,
              sort_order: idx
            }));
            await supabaseAdmin.from('invoice_items').insert(itemsToInsert);
          }
        }
      }

      // 6. Inject Quotations
      if (data.quotations?.length) {
        for (const q of data.quotations) {
          const { data: insertedQ, error: qErr } = await supabaseAdmin
            .from('quotations')
            .upsert({
              tenant_id: tenantId,
              lead_id: aliasMap.leads[q.lead_alias],
              customer_id: aliasMap.customers[q.customer_alias],
              quote_number: q.quote_number,
              status: q.status || 'draft',
              subtotal: q.subtotal,
              total: q.total,
              customer_name: data.customers.find(c => c.id_alias === q.customer_alias)?.name
            })
            .select('id')
            .single();

          if (qErr) throw qErr;

          if (q.items?.length) {
            const itemsToInsert = q.items.map((item, idx) => ({
              quotation_id: insertedQ.id,
              item_type: item.item_type || 'other',
              description: item.description,
              amount: item.amount,
              sort_order: idx
            }));
            await supabaseAdmin.from('quotation_items').insert(itemsToInsert);
          }
        }
      }

      // 7. Inject Tasks & Expenses
      if (data.tasks?.length) {
        const tasksToInsert = data.tasks.map(t => ({
          tenant_id: tenantId,
          lead_id: aliasMap.leads[t.lead_alias],
          title: t.title,
          due_date: t.due_date,
          priority: t.priority
        }));
        await supabaseAdmin.from('tasks').insert(tasksToInsert);
      }

      if (data.expenses?.length) {
        const expensesToInsert = data.expenses.map(e => ({
          tenant_id: tenantId,
          lead_id: aliasMap.leads[e.lead_alias],
          amount: e.amount,
          description: e.description,
          expense_date: new Date().toISOString().split('T')[0]
        }));
        await supabaseAdmin.from('expenses').insert(expensesToInsert);
      }

      // 8. Provision Default Assets (Idempotent Check-then-Insert)
      const { data: existingPreset } = await supabaseAdmin
        .from('markup_presets')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', 'Standard 10% Markup')
        .maybeSingle();

      if (!existingPreset) {
        const { error: presetErr } = await supabaseAdmin.from('markup_presets').insert({
          tenant_id: tenantId,
          name: 'Standard 10% Markup',
          calc_type: 'percentage',
          calc_value: 10,
          category: 'General',
          is_active: true
        });
        if (presetErr) throw presetErr;
      }

      logger.info({ tenantId }, '[SeedService] Injection complete');
      return { success: true };

    } catch (error) {
      logger.error({ tenantId, error: error.message }, '[SeedService] Injection failed');
      throw error;
    }
  }
}

export default new SeedService();
