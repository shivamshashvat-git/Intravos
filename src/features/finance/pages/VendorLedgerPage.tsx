import React, { useState, useMemo } from 'react';
import { 
  Building2, Search, Filter, Plus, ChevronDown, 
  ChevronUp, Wallet, ArrowUpRight, Clock, 
  CheckCircle2, AlertCircle, MoreVertical, 
  CreditCard, ExternalLink, MapPin, User,
  Plane, Hotel, Target, Car, FileText, Landmark
} from 'lucide-react';
import { useVendorLedger } from '../hooks/useVendorLedger';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';
import { VendorSummary, SupplierPaymentStatus, SupplierType } from '../types/vendorLedger';
import { RecordVendorPaymentDrawer } from '../components/RecordVendorPaymentDrawer';

export const VendorLedgerPage: React.FC = () => {
  const { 
    suppliers, loading, selectedSupplier, services, 
    drawerOpen, setDrawerOpen, drawerType, setDrawerType,
    selectSupplier, recordPayment, refreshAll 
  } = useVendorLedger();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.city?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || s.supplier_type === typeFilter;
      
      const status = s.outstanding === 0 ? 'paid' : (s.total_paid > 0 ? 'partial' : 'unpaid');
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      
      return matchSearch && matchType && matchStatus;
    });
  }, [suppliers, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalPayable = suppliers.reduce((sum, s) => sum + s.outstanding, 0);
    const overdueCount = suppliers.filter(s => s.outstanding > 0).length; // Simplified for now
    
    return {
      totalSuppliers: suppliers.length,
      totalPayable,
      overdue: overdueCount
    };
  }, [suppliers]);

  if (loading && suppliers.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center italic text-slate-300 font-black uppercase tracking-[0.3em]">
        Acquiring Vendor Ledgers...
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-40">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div>
             <h1 className="text-6xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">Vendor Ledger</h1>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mt-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Accounts Payable Operational Stream
             </p>
          </div>
          <button className="px-10 py-4 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase italic tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <Plus className="w-5 h-5 text-emerald-400" /> Initialize New Supplier Node
          </button>
       </div>

       {/* Stats Section */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          <StatCard label="Total Supplier Nodes" value={stats.totalSuppliers} icon={Building2} />
          <StatCard 
            label="Gross Nodes Payable" 
            value={formatINR(stats.totalPayable)} 
            icon={Wallet} 
            variant={stats.totalPayable > 0 ? 'danger' : 'success'} 
          />
          <StatCard label="Overdue Settlements" value={stats.overdue} icon={Clock} variant="warning" />
          <StatCard label="Precision Reconciliations" value="100%" icon={CheckCircle2} variant="success" />
       </div>

       {/* Filters */}
       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mx-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
             <input 
               className="w-full pl-14 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm tracking-tight"
               placeholder="Search Supplier Identity, City, Region..."
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               className="flex-1 md:flex-none px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
               value={typeFilter}
               onChange={e => setTypeFilter(e.target.value)}
             >
                <option value="all">Every Category</option>
                <option value="hotel">Hotels</option>
                <option value="flight">Airlines</option>
                <option value="activity">Activities</option>
                <option value="transfer">Transfers</option>
             </select>
             <select 
               className="flex-1 md:flex-none px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
             >
                <option value="all">Every Status</option>
                <option value="unpaid">Zero Payment</option>
                <option value="partial">Partially Stabilized</option>
                <option value="paid">Fully Settled</option>
             </select>
          </div>
       </div>

       {/* Supplier Table */}
       <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100 mx-4 italic">
          <table className="w-full border-collapse">
             <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                   <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Identity</th>
                   <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Type</th>
                   <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Service Nodes</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total Payable</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding</th>
                   <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {filteredSuppliers.map(s => (
                  <React.Fragment key={s.id}>
                    <tr 
                      className={clsx(
                        "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                        expandedId === s.id && "bg-slate-50/50 border-l-[6px] border-indigo-600"
                      )}
                      onClick={() => {
                        const nextId = expandedId === s.id ? null : s.id;
                        setExpandedId(nextId);
                        if (nextId) selectSupplier(s);
                      }}
                    >
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic shadow-lg group-hover:scale-110 transition-transform">{s.name.charAt(0)}</div>
                             <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-none mb-1.5">{s.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <MapPin className="w-3 h-3" /> {s.city || 'GLOBAL'}, {s.country || 'IN'}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <SupplierTypeBadge type={s.supplier_type} />
                       </td>
                       <td className="px-10 py-8">
                          <div className="text-[10px] font-black uppercase flex items-center gap-1.5 text-slate-500">
                             <Target className="w-3.5 h-3.5" /> {s.service_count} NODES
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right font-black italic text-slate-900 text-sm">
                          {formatINR(s.total_cost)}
                       </td>
                       <td className={clsx(
                         "px-10 py-8 text-right font-black italic text-sm",
                         s.outstanding > 0 ? "text-rose-600 animate-pulse" : "text-emerald-500"
                       )}>
                          {formatINR(s.outstanding)}
                       </td>
                       <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-3">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 selectSupplier(s);
                                 setDrawerType({ type: 'supplier', id: s.id });
                                 setDrawerOpen(true);
                               }}
                               className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
                             >
                               Record Settle
                             </button>
                             <div className="p-2 text-slate-200">
                                {expandedId === s.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                             </div>
                          </div>
                       </td>
                    </tr>
                    
                    {/* Collapsible Panel */}
                    {expandedId === s.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-10 py-12">
                           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
                                 <div>
                                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest italic flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-indigo-600" /> Active Service Nodes
                                    </h4>
                                 </div>
                                 <div className="text-[10px] font-bold text-slate-400 italic">
                                    Last Disbursement: {s.last_payment_date ? timeAgo(s.last_payment_date) : 'Never Initialized'}
                                 </div>
                              </div>
                              
                              <div className="overflow-x-auto">
                                 <table className="w-full">
                                    <thead>
                                       <tr className="border-b border-slate-50">
                                          <th className="px-8 py-4 text-left text-[9px] font-black text-slate-300 uppercase tracking-widest">Mission Ref</th>
                                          <th className="px-8 py-4 text-left text-[9px] font-black text-slate-300 uppercase tracking-widest">Service Item</th>
                                          <th className="px-8 py-4 text-left text-[9px] font-black text-slate-300 uppercase tracking-widest">Window</th>
                                          <th className="px-8 py-4 text-right text-[9px] font-black text-slate-300 uppercase tracking-widest">Gross Cost</th>
                                          <th className="px-8 py-4 text-right text-[9px] font-black text-slate-300 uppercase tracking-widest">Settled</th>
                                          <th className="px-8 py-4 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">Protocol</th>
                                          <th className="px-8 py-4 text-right text-[9px] font-black text-slate-300 uppercase tracking-widest">Trigger</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                       {services.length === 0 ? (
                                         <tr><td colSpan={7} className="p-12 text-center text-[10px] font-black uppercase text-slate-200 tracking-[0.2em] italic">No active services detected in pipeline</td></tr>
                                       ) : services.map(srv => (
                                         <tr key={srv.id} className="hover:bg-slate-50/50 transition-all">
                                            <td className="px-8 py-5">
                                               <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg italic">{srv.booking_ref}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                               <p className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1">{srv.title}</p>
                                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{srv.service_type}</p>
                                            </td>
                                            <td className="px-8 py-5 text-[9px] font-black text-slate-500 tabular-nums italic">
                                               {new Date(srv.service_start_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900 text-xs italic">
                                               {formatINR(srv.cost_price)}
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-500 text-xs italic">
                                               {formatINR(srv.paid_to_supplier)}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                               <StatusChip status={srv.supplier_payment_status} />
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                               {srv.supplier_payment_status !== 'paid' && (
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDrawerType({ type: 'service', id: srv.id });
                                                    setDrawerOpen(true);
                                                  }}
                                                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm"
                                                >
                                                   <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                               )}
                                            </td>
                                         </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
             </tbody>
          </table>
       </div>

       <RecordVendorPaymentDrawer 
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          supplier={selectedSupplier}
          services={services}
          onSubmit={recordPayment}
          preselectedServiceId={drawerType?.type === 'service' ? drawerType.id : undefined}
       />
    </div>
  );
};

// Utils & Sub-components
const StatCard = ({ label, value, icon: Icon, variant = 'default' }: any) => {
  const styles = {
    default: 'bg-white text-slate-900 border-slate-100',
    danger: 'bg-slate-950 text-white border-white/5 shadow-2xl shadow-indigo-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-100',
    warning: 'bg-amber-50 text-amber-900 border-amber-100'
  } as any;

  return (
    <div className={clsx(
      "p-8 rounded-[2.5rem] border shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-all italic",
      styles[variant]
    )}>
       <div className={clsx(
         "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
         variant === 'danger' ? "bg-white/10 text-white" : "bg-white text-indigo-600 shadow-sm border border-slate-50"
       )}>
          <Icon className="w-8 h-8" />
       </div>
       <div>
          <p className={clsx(
            "text-[10px] font-black uppercase tracking-[0.2em] mb-1.5",
            variant === 'danger' ? "text-slate-400" : "text-slate-400"
          )}>{label}</p>
          <h4 className="text-3xl font-black italic tracking-tighter leading-none">{value}</h4>
       </div>
    </div>
  );
};

const SupplierTypeBadge = ({ type }: { type: SupplierType }) => {
  const icons = {
    hotel: Hotel,
    flight: Plane,
    activity: Target,
    transfer: Car,
    other: FileText
  } as any;
  const Icon = icons[type] || FileText;

  return (
    <div className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit">
       <Icon className="w-3.5 h-3.5 text-slate-400" />
       <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{type}</span>
    </div>
  );
};

const StatusChip = ({ status }: { status: SupplierPaymentStatus }) => {
  const themes = {
    unpaid: 'bg-rose-50 text-rose-500 border-rose-100',
    partial: 'bg-amber-50 text-amber-600 border-amber-100',
    paid: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  } as any;

  return (
    <span className={clsx(
      "px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest italic",
      themes[status]
    )}>
       {status}
    </span>
  );
};

const ShieldCheck = (props: any) => <Landmark {...props} />;
