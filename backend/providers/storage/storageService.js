import { supabaseAdmin } from '../database/supabase.js';
import logger from '../../core/utils/logger.js';
import { resolveBucket } from './storage.js';

/**
 * StorageService
 * High-performance wrapper for Supabase Storage with Secure Signed URLs
 */
class StorageService {
  /**
   * Upload a file to a specific bucket
   */
  async upload(bucketKey, path, buffer, options = {}) {
    const bucket = resolveBucket(bucketKey);
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: options.contentType || 'application/octet-stream',
        upsert: options.upsert || false,
      });

    if (error) throw error;
    return { bucket, path, data };
  }

  /**
   * Generate a time-limited signed URL for a single file
   * Default expiry: 15 minutes (900 seconds)
   */
  async getSignedUrl(bucketKey, path, expiry = 900) {
    if (!path) return null;
    const bucket = resolveBucket(bucketKey);
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiry);

    if (error) {
      logger.error(`[StorageService] Error signing URL for ${path}:`, error.message);
      return null;
    }

    return data.signedUrl;
  }

  /**
   * Generate multiple signed URLs in a single batch request
   * Highly recommended for list views to avoid N+1 network calls
   */
  async getBatchSignedUrls(bucketKey, paths, expiry = 900) {
    if (!paths || !paths.length) return [];
    const bucket = resolveBucket(bucketKey);

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrls(paths, expiry);

    if (error) {
      logger.error(`[StorageService] Error batch signing URLs:`, error.message);
      return [];
    }

    // Returns array of { path, signedUrl, error }
    return data;
  }

  /**
   * Delete a file from storage
   */
  async delete(bucketKey, path) {
    if (!path) return;
    const bucket = resolveBucket(bucketKey);
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }
}

export default new StorageService();
