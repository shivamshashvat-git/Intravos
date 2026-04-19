import { supabaseAdmin  } from '../../providers/database/supabase.js';

function actorName(user) {
  return user?.name || user?.email || 'Unknown staff';
}

function actionStamp(user, timestamp = new Date().toISOString()) {
  return `Done by ${actorName(user)} at ${timestamp}`;
}

function buildSoftDeleteResponse({ table, moduleLabel, record, user, message }) {
  const deletedAt = record?.deleted_at || new Date().toISOString();
  const doneBy = actorName(user);

  return {
    ok: true,
    table,
    module: moduleLabel,
    deleted_at: deletedAt,
    deleted_by: user?.id || null,
    deleted_by_name: doneBy,
    action_label: `${moduleLabel} archived`,
    action_detail: `Done by ${doneBy} at ${deletedAt}`,
    message: message || `${moduleLabel} moved to Trash`,
  };
}

async function softDeleteDirect({
  table,
  id,
  tenantId,
  user,
  moduleLabel,
  extraFilters = {},
  extraUpdates = {},
  select = '*',
  cascadeTo = [],
}) {
  const deletedAt = new Date().toISOString();
  
  let query = supabaseAdmin
    .from(table)
    .update({
      ...extraUpdates,
      deleted_at: deletedAt,
      deleted_by: user?.id || null,
    })
    .eq('id', id);

  if (tenantId) query = query.eq('tenant_id', tenantId);
  Object.entries(extraFilters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query.select(select).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Perform cascading soft-deletes to fix the Ghost Hierarchy fallacy
  if (cascadeTo && cascadeTo.length > 0) {
    for (const cascade of cascadeTo) {
      let cascQuery = supabaseAdmin
        .from(cascade.table)
        .update({
          deleted_at: deletedAt,
          deleted_by: user?.id || null,
        })
        .eq(cascade.fkey, id)
        .is('deleted_at', null);
        
      if (tenantId) cascQuery = cascQuery.eq('tenant_id', tenantId);
      await cascQuery;
    }
  }

  return {
    record: data,
    ...buildSoftDeleteResponse({ table, moduleLabel, record: data, user }),
  };
}

const TRASH_TABLES = {
  leads: {
    moduleLabel: 'Leads',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('id, tenant_id, customer_name, destination, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  customers: {
    moduleLabel: 'Customers',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .select('id, tenant_id, name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  quotations: {
    moduleLabel: 'Quotations',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('quotations')
        .select('id, tenant_id, quote_number, customer_name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  invoices: {
    moduleLabel: 'Invoices',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('id, tenant_id, invoice_number, customer_name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  itineraries: {
    moduleLabel: 'Itineraries',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('itineraries')
        .select('id, tenant_id, title, destination, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  tasks: {
    moduleLabel: 'Tasks',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('id, tenant_id, title, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  calendar_events: {
    moduleLabel: 'Calendar',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('calendar_events')
        .select('id, tenant_id, title, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  offers: {
    moduleLabel: 'Offers',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('offers')
        .select('id, tenant_id, title, destination, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  agents_directory: {
    moduleLabel: 'Directory',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('agents_directory')
        .select('id, tenant_id, name, agency_name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  visa_tracking: {
    moduleLabel: 'Visa Tracking',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('visa_tracking')
        .select('id, tenant_id, traveler_name, destination, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  support_tickets: {
    moduleLabel: 'Support Tickets',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('support_tickets')
        .select('id, tenant_id, subject, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  expenses: {
    moduleLabel: 'Expenses',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .select('id, tenant_id, description, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  expense_categories: {
    moduleLabel: 'Expense Categories',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('expense_categories')
        .select('id, tenant_id, name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  markup_presets: {
    moduleLabel: 'Markup Presets',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('markup_presets')
        .select('id, tenant_id, name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  lead_followups: {
    moduleLabel: 'Lead Follow-ups',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data: record, error } = await supabaseAdmin
        .from('lead_followups')
        .select('id, lead_id, note, deleted_at, deleted_by')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!record) return null;

      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('tenant_id, customer_name')
        .eq('id', record.lead_id)
        .maybeSingle();
      if (leadError) throw leadError;
      if (!lead || lead.tenant_id !== tenantId) return null;

      return { ...record, tenant_id: lead.tenant_id, item_label: record.note || lead.customer_name };
    },
  },
  lead_attachments: {
    moduleLabel: 'Lead Attachments',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data: record, error } = await supabaseAdmin
        .from('lead_attachments')
        .select('id, lead_id, file_name, deleted_at, deleted_by')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!record) return null;

      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('tenant_id, customer_name')
        .eq('id', record.lead_id)
        .maybeSingle();
      if (leadError) throw leadError;
      if (!lead || lead.tenant_id !== tenantId) return null;

      return { ...record, tenant_id: lead.tenant_id, item_label: record.file_name || record.label || lead.customer_name };
    },
  },
  lead_documents: {
    moduleLabel: 'Lead Documents',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data: record, error } = await supabaseAdmin
        .from('lead_documents')
        .select('id, lead_id, doc_type, deleted_at, deleted_by')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!record) return null;

      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('tenant_id, customer_name')
        .eq('id', record.lead_id)
        .maybeSingle();
      if (leadError) throw leadError;
      if (!lead || lead.tenant_id !== tenantId) return null;

      return { ...record, tenant_id: lead.tenant_id, item_label: record.doc_type || lead.customer_name };
    },
  },
  vendor_rate_cards: {
    moduleLabel: 'Vendor Rate Cards',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data: record, error } = await supabaseAdmin
        .from('vendor_rate_cards')
        .select('id, vendor_id, title, file_url, deleted_at, deleted_by')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!record) return null;

      const { data: vendor, error: vendorError } = await supabaseAdmin
        .from('suppliers')
        .select('tenant_id, name')
        .eq('id', record.vendor_id)
        .maybeSingle();
      if (vendorError) throw vendorError;
      if (!vendor || vendor.tenant_id !== tenantId) return null;

      return { ...record, tenant_id: vendor.tenant_id, item_label: record.title || record.file_url || vendor.name };
    },
  },
  itinerary_days: {
    moduleLabel: 'Itinerary Days',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data: record, error } = await supabaseAdmin
        .from('itinerary_days')
        .select('id, itinerary_id, day_number, title, deleted_at, deleted_by')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!record) return null;

      const { data: itinerary, error: itineraryError } = await supabaseAdmin
        .from('itineraries')
        .select('tenant_id, title')
        .eq('id', record.itinerary_id)
        .maybeSingle();
      if (itineraryError) throw itineraryError;
      if (!itinerary || itinerary.tenant_id !== tenantId) return null;

      return {
        ...record,
        tenant_id: itinerary.tenant_id,
        item_label: record.title || `Day ${record.day_number}`,
      };
    },
  },
  itinerary_items: {
    moduleLabel: 'Itinerary Items',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data: record, error } = await supabaseAdmin
        .from('itinerary_items')
        .select('id, day_id, title, item_type, deleted_at, deleted_by')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!record) return null;

      const { data: day, error: dayError } = await supabaseAdmin
        .from('itinerary_days')
        .select('itinerary_id')
        .eq('id', record.day_id)
        .maybeSingle();
      if (dayError) throw dayError;
      if (!day) return null;

      const { data: itinerary, error: itineraryError } = await supabaseAdmin
        .from('itineraries')
        .select('tenant_id, title')
        .eq('id', day.itinerary_id)
        .maybeSingle();
      if (itineraryError) throw itineraryError;
      if (!itinerary || itinerary.tenant_id !== tenantId) return null;

      return {
        ...record,
        tenant_id: itinerary.tenant_id,
        item_label: record.title || record.item_type || itinerary.title,
      };
    },
  },
  suppliers: {
    moduleLabel: 'Suppliers',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('suppliers')
        .select('id, tenant_id, name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  documents: {
    moduleLabel: 'Documents',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('id, tenant_id, file_name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  vouchers: {
    moduleLabel: 'Vouchers',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('vouchers')
        .select('id, tenant_id, booking_reference, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  vendor_ledger: {
    moduleLabel: 'Vendor Ledger',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('vendor_ledger')
        .select('id, tenant_id, amount, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  cancellations: {
    moduleLabel: 'Cancellations',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('cancellations')
        .select('id, tenant_id, reason, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
  group_booking_members: {
    moduleLabel: 'Group Booking Members',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('group_booking_members')
        .select('id, tenant_id, member_name, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },

  resource_hub_links: {
    moduleLabel: 'Resource Hub Links',
    requireFeature: 'trash',
    async getRecord(id, tenantId) {
      const { data, error } = await supabaseAdmin
        .from('resource_hub_links')
        .select('id, tenant_id, title, deleted_at, deleted_by')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  },
};

function getTrashTableConfig(table) {
  return TRASH_TABLES[table] || null;
}

async function restoreTrashRecord({ table, id, tenantId }) {
  const config = getTrashTableConfig(table);
  if (!config) return { error: 'Unsupported trash table', status: 400 };

  const record = await config.getRecord(id, tenantId);
  if (!record) return { error: 'Archived record not found', status: 404 };
  if (!record.deleted_at) return { error: 'Record is not archived', status: 409 };

  const { data, error } = await supabaseAdmin
    .from(table)
    .update({ deleted_at: null, deleted_by: null })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) return { error: 'Archived record not found', status: 404 };

  return {
    record: data,
    table,
    module: config.moduleLabel,
    action_label: `${config.moduleLabel} restored`,
    message: `${config.moduleLabel} restored successfully`,
  };
}

async function permanentlyDeleteTrashRecord({ table, id, tenantId }) {
  const config = getTrashTableConfig(table);
  if (!config) return { error: 'Unsupported trash table', status: 400 };

  const record = await config.getRecord(id, tenantId);
  if (!record) return { error: 'Archived record not found', status: 404 };
  if (!record.deleted_at) return { error: 'Record must be archived before permanent deletion', status: 409 };

  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;

  return {
    ok: true,
    table,
    module: config.moduleLabel,
    action_label: `${config.moduleLabel} permanently deleted`,
    message: `${config.moduleLabel} permanently deleted`,
  };
}

export { actionStamp,
  actorName,
  buildSoftDeleteResponse,
  getTrashTableConfig,
  permanentlyDeleteTrashRecord,
  restoreTrashRecord,
  softDeleteDirect,
  TRASH_TABLES,
 };
