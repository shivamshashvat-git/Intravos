import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Plus, Search, Filter, ShieldCheck, Clock, 
  MapPin, Calendar, Users, AlertCircle, CheckCircle2,
  Lock, Globe, FileText, ChevronRight, MoreVertical,
  XCircle, ArrowRight, Wallet, Hash, Contact, Loader2
} from 'lucide-react';
import { insuranceService, InsurancePolicy } from '../services/insuranceService';
import { AddInsuranceDrawer } from '../components/AddInsuranceDrawer';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const InsurancePage: React.FC = () => {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', month: '' });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, [filters.status, filters.month]);

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const data = await insuranceService.getPolicies({ 
        claim_status: filters.status || undefined 
      });
      setPolicies(data);
    } catch (e) {
      toast.error('Failed to load insurance policies');
    } finally {
      setIsLoading(false);
    }
  };

  const expiringSoonCount = useMemo(() => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return policies.filter(p => new Date(p.coverage_end) <= sevenDaysFromNow && p.status === 'active').length;
  }, [policies]);

  const stats = useMemo(() => ({
    total: policies.length,
    active: policies.filter(p => p.status === 'active').length,
    expired: policies.filter(p => p.status === 'expired').length,
    claimed: policies.filter(p => p.status === 'claimed').length,
  }), [policies]);

  const filteredPolicies = policies.filter(p => 
    p.policy_number.toLowerCase().includes(filters.search.toLowerCase()) ||
    p.provider_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    p.customer?.name?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Insurance Node</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> {stats.active} Active Coverage Protocols
          </p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all uppercase italic text-xs"
        >
          <Plus className="w-4 h-4" /> Issue New Policy
        </button>
      </div>

      {/* Warnings */}
      {expiringSoonCount > 0 && (
        <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-xl flex items-center justify-between px-12 italic border border-amber-400">
          <div className="flex items-center gap-6">
            <AlertCircle className="w-8 h-8" />
            <p className="text-lg font-black uppercase tracking-tighter">{expiringSoonCount} Policies breach 7-day terminal window — Immediate coverage verification required</p>
          </div>
          <button className="px-6 py-2 bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all">Audit Group</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Policies" val={stats.total} icon={Shield} />
        <StatCard label="Active Shield" val={stats.active} icon={ShieldCheck} color="text-emerald-500" />
        <StatCard label="Expired / Terminal" val={stats.expired} icon={Clock} color="text-slate-400" />
        <StatCard label="Claim Events" val={stats.claimed} icon={AlertCircle} color="text-indigo-500" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm tracking-tight"
            placeholder="Search Policy #, Provider, Customer..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
          {(['all', 'active', 'expired', 'claimed'] as const).map(s => (
            <button 
              key={s}
              onClick={() => setFilters({ ...filters, status: s === 'all' ? '' : s })}
              className={clsx(
                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                ((filters.status === s) || (s === 'all' && !filters.status)) ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 text-center italic text-slate-400 uppercase tracking-widest flex items-center justify-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin" /> Syncing Risk Data...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-32 text-center rounded-[2.5rem] border-4 border-dashed border-slate-50 m-6 italic">
            <Shield className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Coverage Vault Empty</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Initialize your first travel protection protocol to start risk tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Policy / Provider</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer / Booking</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coverage Window</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pill</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPolicies.map(p => {
                   const isExpiring = new Date(p.coverage_end) <= new Date(Date.now() + 7 * 86400000) && p.status === 'active';
                   return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group italic">
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.policy_number}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.provider_name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div>
                          <p className="text-sm font-black text-slate-900">{p.customer?.name || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{p.booking?.booking_ref || 'Direct / Standalone'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className={clsx("text-xs font-black uppercase", isExpiring ? "text-amber-600" : "text-slate-600")}>Ends: {new Date(p.coverage_end).toLocaleDateString()}</span>
                          <span className="text-[9px] font-bold text-slate-400">Starts: {new Date(p.coverage_start).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={p.status} warning={isExpiring} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => toast.info('Detailed policy audit view coming soon')}
                          className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddInsuranceDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={fetchPolicies}
      />
    </div>
  );
};

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

const StatusBadge = ({ status, warning }: { status: InsurancePolicy['status'], warning?: boolean }) => {
  const map: Record<InsurancePolicy['status'], { label: string, color: string }> = {
    active: { label: 'Active', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    expired: { label: 'Expired', color: 'bg-slate-50 text-slate-400 border-slate-100' },
    claimed: { label: 'Claimed', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  };
  const theme = map[status];
  return (
    <div className="flex items-center gap-2">
      <span className={clsx("px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", theme.color)}>
        {theme.label}
      </span>
      {warning && (
        <span className="px-2 py-1 bg-amber-500 text-white rounded-md text-[8px] font-black uppercase animate-pulse shadow-lg shadow-amber-100">Expiring Soon</span>
      )}
    </div>
  );
};
