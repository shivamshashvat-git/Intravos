import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, ShieldCheck, Clock, 
  MapPin, Calendar, Users, AlertCircle, CheckCircle2,
  Lock, Globe, FileText, ChevronRight, MoreVertical,
  XCircle, ArrowRight, Wallet, Hash, Contact
} from 'lucide-react';
import { useVisaList } from '../hooks/useVisaList';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { VisaStatus, PassportCustody, VisaTracking } from '../types/visa';
import { clsx } from 'clsx';
import { CreateVisaDrawer } from '../components/CreateVisaDrawer';
import { DocumentsTab } from '@/shared/components/DocumentsTab';
import { X } from 'lucide-react';

export const VisaListPage: React.FC = () => {
  const navigate = useNavigate();
  const { visas, isLoading, filters, setFilters, deleteVisa } = useVisaList();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState<VisaTracking | null>(null);

  // Status breakdown for filters/tabs
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: visas.length,
      pending: visas.filter(v => v.status === 'documents_pending').length,
      atEmbassy: visas.filter(v => v.status === 'submitted_to_embassy' || v.status === 'under_processing').length,
      approvedThisMonth: visas.filter(v => v.status === 'approved' && v.decision_date?.startsWith(today.slice(0, 7))).length,
      rejectedThisMonth: visas.filter(v => v.status === 'rejected' && v.decision_date?.startsWith(today.slice(0, 7))).length,
      overdue: visas.filter(v => {
        const expected = v.expected_decision_date;
        return expected && expected < today && v.status === 'under_processing';
      }).length,
      appointmentsSoon: visas.filter(v => {
        if (!v.vfs_appointment_date) return false;
        const appDt = new Date(v.vfs_appointment_date);
        const soon = new Date();
        soon.setDate(soon.getDate() + 7);
        return appDt >= new Date() && appDt <= soon;
      }).length,
      expiringSoon: visas.filter(v => {
        if (!v.visa_expiry) return false;
        const exp = new Date(v.visa_expiry);
        const limit = new Date();
        limit.setDate(limit.getDate() + 90);
        return exp >= new Date() && exp <= limit;
      }).length
    };
  }, [visas]);

  const toggleFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Visa Registry</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> {stats.total} Active Application Pipelines
          </p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all uppercase italic text-xs"
        >
          <Plus className="w-4 h-4" /> Initialize Visa Node
        </button>
      </div>

      {/* Alert Banners */}
      <div className="space-y-3">
        {stats.overdue > 0 && (
          <div className="bg-rose-600 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between px-12 italic border border-rose-500 animate-pulse">
            <div className="flex items-center gap-6">
              <AlertCircle className="w-8 h-8" />
              <p className="text-lg font-black uppercase tracking-tighter">{stats.overdue} Applications breach decision SLA — Immediate attention required</p>
            </div>
            <button onClick={() => setFilters({ ...filters, overdue: true })} className="px-6 py-2 bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">Filter Group</button>
          </div>
        )}
        {stats.appointmentsSoon > 0 && (
          <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between px-12 italic border border-amber-400">
            <div className="flex items-center gap-6">
              <Calendar className="w-8 h-8" />
              <p className="text-lg font-black uppercase tracking-tighter">{stats.appointmentsSoon} VFS appointments scheduled within 72h window</p>
            </div>
            <button onClick={() => setFilters({ ...filters, appointment_soon: true })} className="px-6 py-2 bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">Review Window</button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard label="Pipeline active" val={stats.total} icon={Hash} />
        <StatCard label="Pending Docs" val={stats.pending} icon={FileText} color="text-amber-500" />
        <StatCard label="At Embassy" val={stats.atEmbassy} icon={Globe} color="text-indigo-500" />
        <StatCard label="Month Approval" val={stats.approvedThisMonth} icon={CheckCircle2} color="text-emerald-500" />
        <StatCard label="Month Rejected" val={stats.rejectedThisMonth} icon={XCircle} color={stats.rejectedThisMonth > 0 ? "text-rose-500" : "text-slate-300"} />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm tracking-tight"
            placeholder="Search Traveler, Passport, Reference..."
            value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['all', 'documents_pending', 'documents_received', 'submitted_to_embassy', 'under_processing', 'approved', 'rejected'] as const).map(s => (
            <button 
              key={s}
              onClick={() => toggleFilter('status', s === 'all' ? undefined : s)}
              className={clsx(
                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                (filters.status === s || (s === 'all' && !filters.status)) ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 text-center italic text-slate-400 uppercase tracking-widest">Hydrating Visa Data...</div>
        ) : visas.length === 0 ? (
          <div className="p-32 text-center rounded-[2.5rem] border-4 border-dashed border-slate-50 m-6 italic">
            <Lock className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Registry Empty</h3>
            <p className="text-sm font-bold text-slate-400 mt-2 px-20">Initialize your first traveler visa node to start sequence tracking.</p>
            <button onClick={() => setIsDrawerOpen(true)} className="mt-10 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 mx-auto shadow-xl shadow-indigo-100 uppercase text-xs italic tracking-widest">
              + Initialize Node
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Traveler</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workflow</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Custody</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">VFS Window</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visas.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group italic">
                    <td className="px-8 py-6">
                       <button onClick={() => navigate(`/visa/${v.id}`)} className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black italic shadow-lg">{v.traveler_name.charAt(0)}</div>
                          <div>
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{v.traveler_name}</p>
                             <p className={clsx("text-[9px] font-bold uppercase", isExpiringSoon(v.passport_expiry) ? "text-rose-500 animate-pulse" : "text-slate-400")}>
                                Passport: {maskPassport(v.passport_number)} | Exp: {v.passport_expiry || 'TBD'}
                             </p>
                          </div>
                       </button>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-black uppercase flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-indigo-400" /> {v.visa_country}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{v.visa_type} {v.visa_category}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 font-mono">
                       <StatusBadge status={v.status} />
                    </td>
                    <td className="px-8 py-6 font-mono text-[9px]">
                       <CustodyBadge custody={v.passport_custody} />
                    </td>
                    <td className="px-8 py-6 font-mono">
                       {v.vfs_appointment_date ? (
                         <div className={clsx(
                           "text-xs font-black",
                           isUrgent(v.vfs_appointment_date) ? "text-rose-600" : "text-slate-600"
                         )}>
                            {new Date(v.vfs_appointment_date).toLocaleDateString()}
                         </div>
                       ) : <span className="text-[10px] font-bold text-slate-300">UNSCHEDULED</span>}
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedVisa(v)} className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
                             <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteVisa(v.id)} className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateVisaDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Visa Documents Panel */}
      {selectedVisa && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setSelectedVisa(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Visa Documents</p>
                <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{selectedVisa.traveler_name}</h2>
                <p className="text-xs text-slate-400 font-bold mt-1">{selectedVisa.visa_country} · {selectedVisa.visa_type}</p>
              </div>
              <button
                onClick={() => setSelectedVisa(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Documents Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              <DocumentsTab
                entityType={selectedVisa.lead_id ? 'lead' : 'customer'}
                entityId={(selectedVisa.lead_id || selectedVisa.customer_id)!}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Utils & Sub-components
const StatCard = ({ label, val, icon: Icon, color = "text-slate-400" }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all italic">
    <div className={clsx("w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center transition-all", color)}>
       <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">{val}</h3>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: VisaStatus }) => {
  const map: Record<VisaStatus, { label: string, color: string }> = {
    documents_pending: { label: 'Pending Docs', color: 'bg-rose-50 text-rose-500 border-rose-100' },
    documents_received: { label: 'Docs Received', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    submitted_to_embassy: { label: 'At Embassy', color: 'bg-blue-50 text-blue-500 border-blue-100' },
    under_processing: { label: 'Processing', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-500 border-rose-200 line-through' },
    cancelled: { label: 'Cancelled', color: 'bg-slate-50 text-slate-300 border-slate-100' },
  };
  const theme = map[status] || map.documents_pending;
  return (
    <span className={clsx("px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", theme.color)}>
      {theme.label}
    </span>
  );
};

const CustodyBadge = ({ custody }: { custody: PassportCustody }) => {
  const map: Record<PassportCustody, { label: string, color: string }> = {
    with_client: { label: 'With Client', color: 'bg-slate-50 text-slate-400' },
    with_agency: { label: 'At Agency', color: 'bg-indigo-500 text-white shadow-indigo-100' },
    submitted_to_vfs: { label: 'At VFS', color: 'bg-amber-500 text-white shadow-amber-100' },
    submitted_to_embassy: { label: 'At Embassy', color: 'bg-amber-600 text-white shadow-amber-200' },
    returned_to_client: { label: 'Returned', color: 'bg-emerald-500 text-white shadow-emerald-100' },
  };
  const theme = map[custody] || map.with_client;
  return (
    <span className={clsx("px-3 py-1 rounded-lg font-black uppercase tracking-[0.1em]", theme.color)}>
      {theme.label}
    </span>
  );
};

const maskPassport = (p?: string | null) => {
   if (!p) return 'UNMAPPED';
   if (p.length < 4) return p;
   return p.slice(0, 2) + '*'.repeat(p.length - 4) + p.slice(-2);
};

const isUrgent = (dateStr: string) => {
   const diff = new Date(dateStr).getTime() - Date.now();
   return diff > 0 && diff < 3 * 86400000;
};

const isExpiringSoon = (dateStr?: string | null) => {
   if (!dateStr) return false;
   const diff = new Date(dateStr).getTime() - Date.now();
   return diff < 180 * 86400000;
};

const Eye = (props: any) => <FileText {...props} />;
const Trash2 = (props: any) => <XCircle {...props} />;
