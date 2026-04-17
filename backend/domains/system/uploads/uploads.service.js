import { supabaseAdmin } from '../../../providers/database/supabase.js';
import storageService from '../../../providers/storage/storageService.js';
import { resolveBucket } from '../../../providers/storage/storage.js';

/**
 * UploadService — Generic Cloud Asset Ingestion & Quota Orchestrator
 */
class UploadService {
  /**
   * Orchestrate generic file upload with tenant-level storage limit enforcement
   */
  async handleGenericUpload(tenantId, userId, file, bucketKey = 'uploads') {
    if (!file) throw new Error('file field is required');

    const bucket = resolveBucket(bucketKey);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${tenantId}/${Date.now()}-${safeName}`;

    // Load tenant storage context
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('storage_limit_mb, storage_used_mb')
      .eq('id', tenantId)
      .single();

    const fileSizeMB = file.size / (1024 * 1024);
    
    if (tenant && (tenant.storage_used_mb + fileSizeMB > tenant.storage_limit_mb)) {
      throw new Error(`Storage limit reached (${tenant.storage_limit_mb}MB capacity). Purchase additional space to continue.`);
    }

    // Physical Upload
    await storageService.upload(bucketKey, path, file.buffer, { contentType: file.mimetype });

    // Logical Metadata Sync
    if (tenant) {
      await supabaseAdmin.from('tenants')
        .update({ storage_used_mb: tenant.storage_used_mb + Math.ceil(fileSizeMB) })
        .eq('id', tenantId);
    }

    const signedUrl = await storageService.getSignedUrl(bucketKey, path);

    return {
      bucket,
      path,
      signed_url: signedUrl,
      size_mb: fileSizeMB.toFixed(2),
      mime_type: file.mimetype
    };
  }
}

export default new UploadService();
