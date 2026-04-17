import { spawn } from 'child_process';
import googleDriveService from '../providers/storage/googleDriveService.js';

export async function databaseBackupTask() {
  console.log('[Cron] Starting Daily Database Backup to Google Drive...');

  if (!process.env.SUPABASE_DB_URL) {
    console.error('[DatabaseBackup] SUPABASE_DB_URL is explicitly required for pg_dump.');
    return { success: false, reason: 'Missing DB URL' };
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `intravos_backup_${dateStr}.sql.gz`;

  return new Promise((resolve, reject) => {
    // We spawn pg_dump and pipe its standard output through gzip compression
    const pgDumpArgs = [
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--schema=public',
      process.env.SUPABASE_DB_URL
    ];

    const pgDumpProcess = spawn('pg_dump', pgDumpArgs);
    const gzipProcess = spawn('gzip', ['-9']);

    pgDumpProcess.stdout.pipe(gzipProcess.stdin);

    let errorOutput = '';
    pgDumpProcess.stderr.on('data', data => { errorOutput += data.toString(); });
    
    pgDumpProcess.on('error', (err) => {
      console.error('[DatabaseBackup] pg_dump spawn failed:', err);
      reject(err);
    });

    gzipProcess.on('error', (err) => {
      console.error('[DatabaseBackup] gzip spawn failed:', err);
      reject(err);
    });

    // Send the gzip readable stream directly to Google Drive
    googleDriveService.uploadDumpStream(fileName, gzipProcess.stdout)
      .then(fileId => {
        console.log(`[Cron] Database Backup completed successfully. Drive File ID: ${fileId}`);
        resolve({ success: true, fileId });
      })
      .catch(err => {
        console.error('[Cron] Database Backup Upload Failed:', err);
        reject(err);
      });

    pgDumpProcess.on('close', code => {
      if (code !== 0) {
        console.error('[DatabaseBackup] pg_dump exited with error code', code);
        console.error('[DatabaseBackup] Stderr:', errorOutput);
      }
    });
  });
}
