import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, CheckCircle, Clock, AlertCircle, 
  Trash2, Eye, Receipt, Wallet, Banknote, Calendar 
} from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';
import { InvoiceStatus } from '../types/invoice';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    invoices, isLoading, filters, setFilters, 
    summary, toggleOverdue, refresh 
  } = useInvoices();

  const isAdmin = ['admin', 'agency_admin', 'super_admin'].includes(user?.role || '');

  const statusTabs: { id: InvoiceStatus | 'all'; label: string; color: string }[] = [
    { id: 'all', label: 'All Nodes', color: 'bg-slate-100 text-slate-600' },
    { id: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-600' },
    { id: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-600' },
    { id: 'partially_paid', label: 'Partial', color: 'bg-amber-100 text-amber-600' },
    { id: 'paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-600' },
    { id: 'overdue', label: 'Overdue', color: 'bg-rose-100 text-rose-600' },
    { id: 'cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end px-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Billing Ledger</h1>
            <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black italic">{invoices.length}</span>
          </div>
          <p className="text-slate-400 font-bold italic lowercase italic">Managing receivables and liquidity flow</p>
        </div>
        <Link to="/invoices/new" className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-4 h-4 text-emerald-400" /> New Invoice Node
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 px-4">
        <StatCard label="Total Invoiced" value={formatINR(summary.totalInvoiced)} icon={Receipt} color="text-slate-900" bg="bg-slate-100" />
        <StatCard label="Collected Total" value={formatINR(summary.totalCollected)} icon={Wallet} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Outstanding Pool" value={formatINR(summary.totalOutstanding)} icon={Banknote} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Overdue Pressure" value={formatINR(summary.overdueValue)} sub={`${summary.overdueCount} Critical Nodes`} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" highlight={summary.overdueCount > 0} />
        <StatCard label="Current Month Flux" value={formatINR(summary.thisMonthValue)} icon={Calendar} color="text-blue-600" bg="bg-blue-50" />
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

          <div className="flex items-center gap-4 max-w-xl w-full">
            <div className="relative group flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH INV #, CUSTOMER, PROPOSAL..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase italic focus:bg-white focus:border-indigo-200 transition-all"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value.toUpperCase() })}
              />
            </div>
            <button 
               onClick={toggleOverdue}
               className={clsx(
                 "px-6 py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest italic border transition-all",
                 filters.overdue ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100" : "bg-white text-rose-500 border-rose-100 hover:bg-rose-50"
               )}
            >
               Pressure Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Identify</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Metadata</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Proposal Link</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Dates</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Value Nodes</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status NODE</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : 
                invoices.length === 0 ? <EmptyState /> :
                invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="py-6 px-6">
                    <p className="text-[10px] font-mono font-black text-indigo-600 mb-0.5">{inv.invoice_number}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Liquid Asset Node</p>
                  </td>
                  <td className="py-6 px-6">
                    <p className="text-sm font-black uppercase text-slate-900 leading-none mb-1">{inv.customer?.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight italic">Corporate Mapping Connected</p>
                  </td>
                  <td className="py-6 px-6">
                    <p className="text-[10px] font-black uppercase text-slate-700 leading-tight">{inv.title}</p>
                    {inv.quotation && <p className="text-[8px] font-bold text-indigo-400 uppercase mt-1 italic">Linked to {inv.quotation.quote_number}</p>}
                  </td>
                  <td className="py-6 px-6 text-center">
                    <div className="inline-flex flex-col items-center">
                       <p className="text-[10px] font-black text-slate-900 mb-1">{new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                       <p className={clsx(
                         "text-[9px] font-black px-2 py-0.5 rounded-full uppercase italic",
                         inv.status === 'overdue' ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-400"
                       )}>Due: {new Date(inv.due_date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="space-y-1">
                       <p className="text-xs font-black text-slate-900">{formatINR(inv.total_amount)}</p>
                       <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-emerald-600 italic">P: {formatINR(inv.amount_paid)}</span>
                          <span className={clsx("text-[9px] font-black italic", inv.amount_outstanding > 0 ? "text-rose-600 underline" : "text-slate-300")}>O: {formatINR(inv.amount_outstanding)}</span>
                       </div>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/invoices/${inv.id}`} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all shadow-sm"><Eye className="w-4 h-4" /></Link>
                      <button onClick={() => navigate(`/invoices/${inv.id}`)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-emerald-100 rounded-xl transition-all shadow-sm"><Wallet className="w-4 h-4" /></button>
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

const StatCard = ({ label, value, sub, icon: Icon, color, bg, highlight }: any) => (
  <div className={clsx(
    "bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 group hover:-translate-y-2 transition-all overflow-hidden relative",
    highlight && "ring-2 ring-rose-500 ring-offset-4"
  )}>
    <div className="flex justify-between items-start mb-6">
      <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12", bg)}>
        <Icon className={clsx("w-6 h-6", color)} />
      </div>
    </div>
    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
    <h4 className={clsx("text-xl font-black italic tracking-tighter leading-none whitespace-nowrap", color)}>{value}</h4>
    {sub && <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1">{sub}</p>}
  </div>
);

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const map: Record<InvoiceStatus, { bg: string, text: string, label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft Node' },
    sent: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Deployed' },
    partially_paid: { bg: 'bg-amber-100', text: 'text-amber-600', label: 'Partial Inflow' },
    paid: { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Cleaned' },
    overdue: { bg: 'bg-rose-100 text-rose-600 ring-2 ring-rose-100 ring-offset-1', text: 'text-rose-600', label: 'Pressure' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-400', label: 'Terminated' }
  };
  const theme = map[status] || map.draft;
  return (
    <span className={clsx("px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-wider whitespace-nowrap", theme.bg, theme.text)}>
      {theme.label}
    </span>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td colSpan={7} className="py-8 px-6 bg-slate-50/20 rounded-2xl mb-2"></td>
  </tr>
);

const EmptyState = () => (
    <tr>
      <td colSpan={10} className="py-24 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Receipt className="w-8 h-8 text-slate-200" />
        </div>
        <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-[0.2em]">Liquid Assets Undetected in Current Flux.</p>
        <Link to="/invoices/new" className="text-[10px] font-black uppercase text-indigo-600 mt-4 inline-block hover:underline underline-offset-8">Initialize First Asset Protocol →</Link>
      </td>
    </tr>
);
