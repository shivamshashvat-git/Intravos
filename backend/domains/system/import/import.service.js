import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * ImportService — Multi-Standard Data Intake Orchestrator
 */
class ImportService {
  /**
   * Orchestrate initial file upload and metadata extraction
   */
  async uploadFile(tenantId, userId, file, importType) {
    if (!file) throw new Error('file field is required');

    const parsed = this._parseCsv(file.buffer);
    const tag = this._importTag(file.originalname);

    const { data, error } = await supabaseAdmin
      .from('import_logs')
      .insert({
        tenant_id: tenantId,
        file_name: file.originalname,
        import_type: importType || 'customers',
        records_total: parsed.rows.length,
        field_mapping: {},
        import_tag: tag,
        imported_by: userId,
        preview_rows: parsed.rows.slice(0, 20)
      })
      .select()
      .single();

    if (error) throw error;

    return {
      import_log: data,
      headers: parsed.headers,
      sample_rows: parsed.rows.slice(0, 5)
    };
  }

  /**
   * Preview mapping and detect potential conflicts
   */
  async previewMapping(tenantId, payload) {
    const { import_log_id, field_mapping = {}, rows = [] } = payload;
    const previewRows = rows.length > 0 ? rows : [];
    const duplicateChecks = [];
    const validationErrors = [];

    // Sample validation for the first 50 rows to keep it responsive
    const validationSample = previewRows.slice(0, 50);

    for (const [index, row] of validationSample.entries()) {
      const phone = row[field_mapping.phone] || row.phone || row.customer_phone;
      const email = row[field_mapping.email] || row.email;

      if (!phone && !email) {
        validationErrors.push({ row: index + 1, field: 'phone/email', error: 'Either phone or email is required' });
        continue;
      }

      if (phone) {
        const { data: existing } = await supabaseAdmin
          .from('customers')
          .select('id, name, phone')
          .eq('tenant_id', tenantId)
          .eq('phone', phone)
          .is('deleted_at', null)
          .maybeSingle();
        if (existing) duplicateChecks.push({ row: index + 1, match: existing });
      }
    }

    if (import_log_id) {
      await supabaseAdmin
        .from('import_logs')
        .update({
          field_mapping,
          preview_rows: previewRows.slice(0, 50),
          records_duplicate: duplicateChecks.length,
          records_skipped: validationErrors.length,
          errors: validationErrors
        })
        .eq('id', import_log_id)
        .eq('tenant_id', tenantId);
    }

    return {
      preview: previewRows.slice(0, 20),
      duplicates: duplicateChecks,
      validation_errors: validationErrors
    };
  }

  /**
   * Orchestrate final batch ingestion with duplicate evasion
   */
  async executeImport(tenantId, payload) {
    const { import_log_id, field_mapping = {}, rows = [], consent_confirmed, liability_acknowledged } = payload;
    
    if (!consent_confirmed || !liability_acknowledged) {
      throw new Error('DPDPA consent and liability acknowledgement are required');
    }
    if (!import_log_id) throw new Error('import_log_id is required');

    const { data: log, error: logError } = await supabaseAdmin
      .from('import_logs')
      .select('*')
      .eq('id', import_log_id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (logError || !log) throw new Error('Import log not found');

    let importedCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;
    const errors = [];
    const validRows = [];

    // 1. Initial validation sweep
    for (const [index, row] of rows.entries()) {
      const name = row[field_mapping.name] || row.name || row.customer_name;
      const phone = row[field_mapping.phone] || row.phone || row.customer_phone;
      const email = row[field_mapping.email] || row.email || null;
      
      if (!name || (!phone && !email)) {
        skippedCount++;
        errors.push({ row: index + 1, field: 'name/phone', error: 'name and at least phone or email are required' });
        continue;
      }
      validRows.push({ index, name, phone, email, row });
    }

    // 2. Batch duplicate detection logic
    const phones = validRows.map(r => r.phone).filter(Boolean);
    const emails = validRows.filter(r => !r.phone && r.email).map(r => r.email);

    const existingPhones = new Set();
    const existingEmails = new Set();

    if (phones.length > 0) {
      const { data: phoneMatches } = await supabaseAdmin
        .from('customers')
        .select('phone')
        .eq('tenant_id', tenantId)
        .in('phone', phones)
        .is('deleted_at', null);
      for (const m of phoneMatches || []) existingPhones.add(m.phone);
    }

    if (emails.length > 0) {
      const { data: emailMatches } = await supabaseAdmin
        .from('customers')
        .select('email')
        .eq('tenant_id', tenantId)
        .in('email', emails)
        .is('deleted_at', null);
      for (const m of emailMatches || []) existingEmails.add(m.email);
    }

    // 3. Transform and Batch Insert
    const toInsert = [];
    const mappedKeys = new Set(Object.values(field_mapping));

    for (const { name, phone, email, row } of validRows) {
      if ((phone && existingPhones.has(phone)) || (!phone && email && existingEmails.has(email))) {
        duplicateCount++;
        skippedCount++;
        continue;
      }

      const unmapped = Object.entries(row).filter(([key]) => !mappedKeys.has(key));
      toInsert.push({
        tenant_id: tenantId,
        name,
        phone,
        email,
        city: row[field_mapping.city] || row.city || null,
        tags: [log.import_tag].filter(Boolean),
        notes: unmapped.length > 0 ? `Migration notes: ${JSON.stringify(Object.fromEntries(unmapped))}` : null,
      });
    }

    if (toInsert.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        const batch = toInsert.slice(i, i + BATCH_SIZE);
        const { error: insertErr } = await supabaseAdmin.from('customers').insert(batch);

        if (insertErr) {
          errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: insertErr.message });
          skippedCount += batch.length;
        } else {
          importedCount += batch.length;
        }
      }
    }

    // 4. Update Log and Return
    const { data: updatedLog, error: updateError } = await supabaseAdmin
      .from('import_logs')
      .update({
        records_total: rows.length,
        records_imported: importedCount,
        records_skipped: skippedCount,
        records_duplicate: duplicateCount,
        field_mapping,
        consent_confirmed: true,
        liability_acknowledged: true,
        completed_at: new Date().toISOString(),
        errors })
      .eq('id', import_log_id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedLog;
  }

  /**
   * Fetch intake history
   */
  async getLogs(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('import_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // --- INTERNAL UTILITIES ---

  _parseCsv(buffer) {
    const raw = buffer.toString('utf8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || null;
      });
      return obj;
    });

    return { headers, rows };
  }

  _importTag(filename) {
    const date = new Date().toISOString().split('T')[0];
    const cleanName = filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `import-${date}-${cleanName}`;
  }
}

export default new ImportService();
