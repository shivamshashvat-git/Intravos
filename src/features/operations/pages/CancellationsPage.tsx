import React, { useState, useEffect } from 'react';
import { 
  XCircle, Search, Calendar, FileText, Loader2, Download,
  Filter, ChevronRight, User, AlertCircle
} from 'lucide-react';
import { cancellationsService, CancellationRecord } from '../services/cancellationsService';
import { formatINR } from '@/utils/currency';
import { toast } from 'sonner';
import { clsx } from 'clsx';

export const CancellationsPage: React.FC = () => {
  const [cancellations, setCancellations] = useState<CancellationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchCancellations();
  }, []);

  const fetchCancellations = async () => {
    setIsLoading(true);
    try {
      const data = await cancellationsService.getCancellations();
      setCancellations(data);
    } catch (e) {
      toast.error('Failed to load cancellation logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = cancellations.filter(c => {
    const matchesSearch = c.bookings?.booking_ref.toLowerCase().includes(filters.search.toLowerCase()) ||
      c.bookings?.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      c.reason.toLowerCase().includes(filters.search.toLowerCase());
    
    const cancelDate = new Date(c.created_at);
    const matchesStart = !filters.startDate || cancelDate >= new Date(filters.startDate);
    const matchesEnd = !filters.endDate || cancelDate <= new Date(filters.endDate);
    
    return matchesSearch && matchesStart && matchesEnd;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Booking Ref', 'Customer', 'Reason', 'Penalty', 'Refund', 'Cancelled By'];
    const rows = filtered.map(c => [
      new Date(c.created_at).toLocaleDateString(),
      c.bookings?.booking_ref,
      c.bookings?.customer_name,
      `"${c.reason.replace(/"/g, '""')}"`,
      c.penalty_amount,
      c.refund_amount,
      c.cancelled_by
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cancellations_audit_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Cancellation Hub</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" /> Immutable Operational Audit Trail
          </p>
        </div>
        <button 
          onClick={exportCSV}
          className="px-8 py-3 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all uppercase italic text-xs"
        >
          <Download className="w-4 h-4" /> Export Audit Log (CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm tracking-tight"
            placeholder="Search Reference, Customer, Reason..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
           <div className="flex items-center gap-2 px-3">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="date"
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none"
                value={filters.startDate}
                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              />
           </div>
           <div className="w-4 h-px bg-slate-200" />
           <div className="flex items-center gap-2 px-3">
              <input 
                type="date"
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none"
                value={filters.endDate}
                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              />
           </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 text-center italic text-slate-400 uppercase tracking-widest flex items-center justify-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin" /> Verifying Reversal Chain...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-32 text-center rounded-[2.5rem] m-6 italic bg-slate-50/10">
            <XCircle className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Log Empty</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Zero booking cancellations recorded in the current epoch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ref / Destination</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reason / Date</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Penalty</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group italic">
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{c.bookings?.booking_ref || 'TRM-LOST'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.bookings?.destination || 'Global'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {c.bookings?.customer_name?.charAt(0)}
                        </div>
                        <p className="text-sm font-black text-slate-900">{c.bookings?.customer_name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-xs font-bold text-slate-600 line-clamp-1">{c.reason}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{new Date(c.created_at).toLocaleDateString()} · By {c.cancelled_by}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-rose-600 italic">
                      {formatINR(c.penalty_amount)}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-emerald-600 italic">
                      {formatINR(c.refund_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
