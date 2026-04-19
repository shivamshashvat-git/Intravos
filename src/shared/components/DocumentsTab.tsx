import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FileText, Image, File, Trash2,
  Download, AlertCircle, Loader2, FilePlus, X
} from 'lucide-react';
import { apiClient } from '@/core/lib/apiClient';
import { useAuth } from '@/core/hooks/useAuth';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────

export interface DocumentRecord {
  id: string;
  file_name: string;
  file_url: string | null;
  storage_path: string | null;
  file_size_bytes: number;
  mime_type: string;
  category?: string;
  uploaded_by?: string;
  created_at: string;
}

interface DocumentsTabProps {
  entityType: 'booking' | 'visa' | 'customer' | 'lead';
  entityId: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
const MAX_SIZE_MB = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-slate-400" />;
}

const entityParamMap: Record<string, string> = {
  booking: 'booking_id',
  visa: 'lead_id',       // visas attach to lead_id in the documents table
  customer: 'customer_id',
  lead: 'lead_id',
};

// ─── Main Component ───────────────────────────────────────────

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ entityType, entityId }) => {
  const { user } = useAuth();
  const isAdminOrManager = ['admin', 'agency_admin', 'super_admin'].includes(user?.role || '');

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paramKey = entityParamMap[entityType] || `${entityType}_id`;

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(`/api/operations/documents?${paramKey}=${entityId}`);
      if (!res.ok) throw new Error('Failed to load documents');
      const json = await res.json();
      setDocuments(json.data?.documents || json.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entityId, paramKey]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTS.includes(ext)) {
      return `File type not allowed. Accepted: ${ALLOWED_EXTS.join(', ')}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(paramKey, entityId);
      formData.append('category', entityType);

      const res = await apiClient('/api/operations/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || 'Upload failed');
      }
      await fetchDocs();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (doc: DocumentRecord) => {
    if (!isAdminOrManager) return;
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;

    setDeletingId(doc.id);
    try {
      const res = await apiClient(`/api/operations/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    if (!doc.file_url) return;
    const a = document.createElement('a');
    a.href = doc.file_url;
    a.download = doc.file_name;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="space-y-6 py-2">
      {/* Upload Zone */}
      <div
        className={clsx(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          onChange={handleFileSelect}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-indigo-600">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FilePlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                Drop a file here or <span className="text-indigo-600 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, JPG, PNG, DOCX · Max {MAX_SIZE_MB} MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Attached Documents
            {!loading && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                {documents.length}
              </span>
            )}
          </h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-48" />
                  <div className="h-2 bg-slate-50 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No documents attached</p>
            <p className="text-xs text-slate-300 mt-1">Upload a file using the zone above</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {documents.map(doc => (
              <div key={doc.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {getFileIcon(doc.mime_type)}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{doc.file_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatBytes(doc.file_size_bytes)}
                    {doc.category && <> · <span className="capitalize">{doc.category}</span></>}
                    {doc.created_at && (
                      <> · {new Date(doc.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}</>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.file_url && (
                    <button
                      onClick={() => handleDownload(doc)}
                      title="Download"
                      className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {isAdminOrManager && (
                    <button
                      onClick={() => handleDelete(doc)}
                      title="Delete"
                      disabled={deletingId === doc.id}
                      className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-300 transition-colors disabled:opacity-40"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
