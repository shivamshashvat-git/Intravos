import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, FileText, 
  CheckCircle, Clock, AlertCircle, Copy, Trash2, Eye 
} from 'lucide-react';
import { useQuotations } from '../hooks/useQuotations';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';
import { QuotationStatus } from '../types/quotation';

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    quotations, isLoading, filters, setFilters, 
    summary, deleteQuotation 
  } = useQuotations();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const statusTabs: { id: QuotationStatus | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: 'bg-slate-100 text-slate-600' },
    { id: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-600' },
    { id: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-600' },
    { id: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-600' },
    { id: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-600' },
    { id: 'revised', label: 'Revised', color: 'bg-purple-100 text-purple-600' },
    { id: 'expired', label: 'Expired', color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end px-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Quotations</h1>
            <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black italic">{summary.totalCount}</span>
          </div>
          <p className="text-slate-400 font-bold italic lowercase">Managing sales proposals and revenue potential</p>
        </div>
        <Link to="/quotations/new" className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4 text-indigo-400" /> New Quotation
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        <StatCard label="Total Propositions" value={summary.totalCount} icon={FileText} color="text-slate-900" bg="bg-slate-100" />
        <StatCard label="Pending Nodes" value={summary.pendingCount} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Conversion Success" value={formatINR(summary.acceptedValue)} sub={`${summary.acceptedCount} Proposals Accepted`} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Sync Efficiency" value={`${Math.round(summary.conversionRate)}%`} sub="Accepted / Total Node Flux" icon={AlertCircle} color="text-indigo-600" bg="bg-indigo-50" />
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-100/50 space-y-8 mx-4">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 items-center overflow-x-auto no-scrollbar">
            {statusTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilters({ ...filters, status: tab.id })}
                className={clsx(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all whitespace-nowrap",
                  filters.status === tab.id ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH QUOTE #, TITLE, CUSTOMER..."
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase italic focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all"
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Identify</th>
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Proposal Metadata</th>
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Destination</th>
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Value Parameters</th>
                {isAdmin && <th className="py-4 px-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Efficiency</th>}
                <th className="py-4 px-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status NODE</th>
                <th className="py-4 px-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} isAdmin={isAdmin} />) : 
                quotations.length === 0 ? <EmptyState /> :
                quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="py-6 px-6">
                    <p className="text-[10px] font-mono font-black text-indigo-600 mb-1">{q.quote_number}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">Version v{q.version}</p>
                  </td>
                  <td className="py-6 px-6">
                    <p className="text-sm font-black uppercase text-slate-900 leading-none mb-1">{q.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight capitalize">{q.customer?.name}</p>
                  </td>
                  <td className="py-6 px-6">
                    <p className="text-[10px] font-black uppercase text-slate-800 italic leading-none">{q.destination || 'Unmapped'}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 whitespace-nowrap">
                       {q.pax_adults}A {q.pax_children > 0 && `| ${q.pax_children}C`}
                    </p>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <p className="text-xs font-black text-slate-900 italic">{formatINR(q.total_amount)}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Post-Tax Settlement</p>
                  </td>
                  {isAdmin && (
                    <td className="py-6 px-6 text-center">
                      <div className={clsx(
                        "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase italic shadow-sm",
                        q.margin_percentage >= 15 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        q.margin_percentage >= 5 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        "bg-red-50 text-red-600 border border-red-100"
                      )}>
                        {Math.round(q.margin_percentage)}%
                      </div>
                    </td>
                  )}
                  <td className="py-6 px-6 text-center">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="flex justify-end gap-2 group-hover:opacity-100 opacity-0 transition-opacity">
                      <Link to={`/quotations/${q.id}`} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all"><Eye className="w-4 h-4" /></Link>
                      <Link to={`/quotations/${q.id}/edit`} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-emerald-100 rounded-xl transition-all"><Copy className="w-4 h-4" /></Link>
                      <button onClick={() => { if(window.confirm('Terminate Proposition?')) deleteQuotation(q.id); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 group hover:-translate-y-2 transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className={clsx("w-14 h-14 rounded-3xl flex items-center justify-center transition-all group-hover:rotate-12", bg)}>
        <Icon className={clsx("w-7 h-7", color)} />
      </div>
    </div>
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{label}</p>
    <h4 className={clsx("text-3xl font-black italic", color)}>{value}</h4>
    {sub && <p className="text-[9px] font-bold text-slate-300 uppercase italic mt-1">{sub}</p>}
  </div>
);

const StatusBadge = ({ status }: { status: QuotationStatus }) => {
  const map: Record<QuotationStatus, { bg: string, text: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
    sent: { bg: 'bg-blue-100', text: 'text-blue-600' },
    accepted: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    rejected: { bg: 'bg-rose-100', text: 'text-rose-600' },
    revised: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    expired: { bg: 'bg-amber-100', text: 'text-amber-600' }
  };
  const theme = map[status] || map.draft;
  return (
    <span className={clsx("px-3 py-1 rounded-full text-[9px] font-black uppercase", theme.bg, theme.text)}>
      {status}
    </span>
  );
};

const SkeletonRow = ({ isAdmin }: { isAdmin: boolean }) => (
  <tr className="animate-pulse">
    <td colSpan={isAdmin ? 7 : 6} className="py-8 px-6 bg-slate-50/20 rounded-2xl mb-2"></td>
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan={10} className="py-20 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <FileText className="w-8 h-8 text-slate-200" />
      </div>
      <p className="text-[10px] font-black uppercase text-slate-300 italic">No propositions found in current node flux.</p>
    </td>
  </tr>
);
