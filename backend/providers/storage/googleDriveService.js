import logger from '../../core/utils/logger.js';
import { google } from 'googleapis';
import stream from 'stream';

/**
 * Google Drive Service
 * Manages database backup uploads and 90-day rolling retention.
 */
class GoogleDriveService {
  constructor() {
    this.driveClient = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    this.init();
  }

  init() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !this.folderId) return;
      
      // Support both raw JSON and base64-encoded JSON (base64 is required for .env single-line storage)
      let credentials;
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      try {
        credentials = JSON.parse(raw);
      } catch {
        // Not valid JSON — try base64 decode
        credentials = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      
      this.driveClient = google.drive({ version: 'v3', auth });
      logger.info('[GoogleDriveService] Initialized successfully.');
    } catch (err) {
      logger.warn('[GoogleDriveService] Initialization failed. Check JSON formatting.', err.message);
    }
  }

  /**
   * Upload an SQL dump stream to Google Drive
   */
  async uploadDumpStream(fileName, readableStream) {
    if (!this.driveClient) throw new Error('Drive API not configured');

    const fileMetadata = {
      name: fileName,
      parents: [this.folderId]
    };

    const media = {
      mimeType: 'application/gzip',
      body: readableStream
    };

    logger.info(`[GoogleDriveService] Uploading ${fileName} to Drive...`);
    const res = await this.driveClient.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    logger.info(`[GoogleDriveService] Upload complete. File ID: ${res.data.id}`);
    
    // Trigger cleanup asynchronously
    this.enforceRetention().catch(err => logger.error('[GoogleDriveService] Cleanup error:', err));
    return res.data.id;
  }

  /**
   * Deletes files in the backup folder older than 90 days.
   */
  async enforceRetention() {
    if (!this.driveClient) return;
    logger.info('[GoogleDriveService] Running 90-day retention cleanup...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const timeLimitStr = ninetyDaysAgo.toISOString();

    // Query files older than 90 days in the target folder
    const query = `'${this.folderId}' in parents and createdTime < '${timeLimitStr}' and trashed = false`;

    const res = await this.driveClient.files.list({
      q: query,
      fields: 'files(id, name, createdTime)',
    });

    const oldFiles = res.data.files || [];
    
    if (oldFiles.length === 0) {
      logger.info('[GoogleDriveService] No expired backups found.');
      return;
    }

    logger.info(`[GoogleDriveService] Found ${oldFiles.length} expired backups. Deleting...`);
    for (const file of oldFiles) {
      await this.driveClient.files.delete({ fileId: file.id });
      logger.info(`[GoogleDriveService] Deleted expired backup: ${file.name}`);
    }
  }
}

export default new GoogleDriveService();
