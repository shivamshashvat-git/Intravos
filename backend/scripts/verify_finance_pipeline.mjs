
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  const tenantId = '2e5682b9-861e-4c70-a534-47b8ba684f1a';
  const leadId = '98a4e1f8-b487-4ba7-9052-493c27d4bd7d';
  const userId = (await supabase.from('users').select('id').eq('tenant_id', tenantId).limit(1).single()).data.id;

  console.log('--- Phase 1: Setup ---');
  await supabase.from('tenants').update({ agency_state: 'Goa' }).eq('id', tenantId);
  console.log('Agency state set to Goa');

  console.log('--- Phase 2: Quotation Creation (Intra-state) ---');
  const { default: quotationService } = await import('./domains/finance/quotations/quotation.service.js');
  
  const payload = {
    lead_id: leadId,
    place_of_supply: 'Goa',
    items: [
      { description: 'Hotel Stay', amount: 10000, gst_rate: 18, cost_price: 8000 },
      { description: 'Transport', amount: 5000, gst_rate: 5, cost_price: 4000 }
    ]
  };

  const quote = await quotationService.createQuotation(tenantId, userId, payload);
  console.log('Quotation created:', quote.quote_number, 'ID:', quote.id);
  console.log('GST Type:', quote.gst_type, 'Total:', quote.total);
  console.log('CGST:', quote.cgst, 'SGST:', quote.sgst, 'IGST:', quote.igst);

  if (quote.gst_type === 'cgst_sgst' && quote.cgst > 0 && quote.igst === 0) {
    console.log('✅ Intra-state GST Calculation Correct');
  } else {
    console.log('❌ Intra-state GST Calculation Failed');
  }

  console.log('--- Phase 3: Revision ---');
  const revision = await quotationService.reviseQuotation(tenantId, userId, quote.id);
  console.log('Revision created. Version:', revision.version, 'Parent:', revision.parent_quote_id);
  
  if (revision.version === 2 && revision.parent_quote_id === quote.id) {
    console.log('✅ Revision Logic Correct');
  } else {
    console.log('❌ Revision Logic Failed');
  }

  console.log('--- Phase 3.5: Price Mutation (Trigger Audit) ---');
  const updatePayload = {
    items: [
      { description: 'Premium Hotel', amount: 15000, gst_rate: 18, cost_price: 12000 },
      { description: 'Transport', amount: 5000, gst_rate: 5, cost_price: 4000 }
    ]
  };
  await quotationService.updateQuotation(tenantId, userId, revision.id, updatePayload);
  console.log('Quotation updated with price mutation');

  console.log('--- Phase 4: Conversion to Invoice ---');
  // Must accept it first
  await supabase.from('quotations').update({ status: 'accepted' }).eq('id', revision.id);
  
  const invoice = await quotationService.convertToInvoice(tenantId, userId, revision.id);
  console.log('Invoice created:', invoice.invoice_number, 'ID:', invoice.id);
  console.log('Linked Quote:', invoice.quotation_id);

  if (invoice.quotation_id === revision.id) {
    console.log('✅ Conversion to Invoice Correct');
  } else {
    console.log('❌ Conversion to Invoice Failed');
  }

  console.log('--- Phase 5: Audit Log Verification ---');
  const { data: audits } = await supabase.from('financial_audit_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('changed_at', { ascending: false })
    .limit(5);
    
  console.log('Recent Audit Logs:', audits.length);
  if (audits.length > 0) {
    console.log('✅ Audit Logging Functional');
  } else {
    console.log('❌ Audit Logging Missing');
  }
}

verify().catch(console.error);
