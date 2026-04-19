import React, { useState, useEffect } from 'react';
import { X, Target, MapPin, Calendar, Users, Briefcase, FileText, IndianRupee, Info, Clock, ShieldCheck, User } from 'lucide-react';
import { Booking, BookingPriority } from '../types/booking';
import { Customer } from '@/features/crm/types/customer';
import { bookingsService } from '../services/bookingsService';
import { quotationsService } from '@/features/finance/services/quotationsService';
import { invoicesService } from '@/features/finance/services/invoicesService';
import { leadsService } from '@/features/crm/services/leadsService';
import { customersService } from '@/features/crm/services/customersService';
import { useAuth } from '@/core/hooks/useAuth';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preFillLeadId?: string;
  onSuccess?: (booking: Booking) => void;
  initialData?: Partial<Booking>;
}

export const CreateBookingDrawer: React.FC<Props> = ({ 
  isOpen, onClose, preFillLeadId, onSuccess, initialData 
}) => {
  const { tenant, user } = useAuth();
  const isAdmin = ['admin', 'agency_admin', 'super_admin'].includes(user?.role || '');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Booking>>({
    title: '',
    destination: '',
    travel_date_start: '',
    travel_date_end: '',
    pax_adults: 1,
    pax_children: 0,
    pax_infants: 0,
    priority: 'normal',
    selling_price: 0,
    cost_price: 0,
    ...initialData
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (preFillLeadId && isOpen) {
        leadsService.getLeadById(preFillLeadId).then(({ lead: l }) => {
            setFormData((prev: Partial<Booking>) => ({
                ...prev,
                lead_id: l.id || undefined,
                customer_id: l.customer_id || undefined,
                title: `${l.customer_name}'s Mission`,
                destination: l.destination || '',
                travel_date_start: l.travel_start_date || '',
                pax_adults: l.guests || 1,
                selling_price: l.selling_price || 0,
                cost_price: l.cost_price || 0
            }));
            // Also need to set customer
            setSelectedCustomer({ id: l.customer_id, name: l.customer_name });
        });
    }
  }, [preFillLeadId, isOpen]);

  useEffect(() => {
    if (selectedCustomer && isOpen) {
       quotationsService.getQuotations(tenant!.id, { customer_id: selectedCustomer.id, status: 'accepted' }).then(res => setQuotations(res));
       invoicesService.getInvoices(tenant!.id, { customer_id: selectedCustomer.id }).then(res => setInvoices(res));
    }
  }, [selectedCustomer, isOpen, tenant]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return toast.error('Identify primary customer node');
    if (!formData.travel_date_start) return toast.error('Identify mission launch date');

    setIsSaving(true);
    try {
      const res = await bookingsService.createBooking({
        ...formData,
        tenant_id: tenant!.id,
        customer_id: selectedCustomer.id,
        created_by: user!.id
      });
      toast.success('Operational Node Deployed');
      if (onSuccess) {
        onSuccess(res);
      } else {
        window.location.href = `/bookings/${res.id}`;
      }
      onClose();
    } catch (e) {
      toast.error('Mission Initialization Failure');
    } finally {
      setIsSaving(false);
    }
  };

  const searchCustomers = async (val: string) => {
    setCustomerSearch(val);
     if (val.length > 2) {
        const res = await customersService.getCustomers(tenant!.id, { search: val });
        setCustomers(res.data);
     }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <header className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div>
              <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Initialize Operational Node</h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1 italic">Converting commercial intent to tactical execution</p>
           </div>
           <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-200"><X className="w-5 h-5 text-slate-400" /></button>
        </header>

        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-12 space-y-12">
           {/* Section: Mission Identity */}
           <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded inline-block italic tracking-widest">Protocol Delta: Trip Identity</h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Mission Title*</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black italic uppercase focus:bg-white transition-all" placeholder="E.G. BALI ADVENTURE 2026" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})} />
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="relative">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Customer Anchor*</label>
                       {selectedCustomer ? (
                         <div className="p-4 bg-indigo-600 text-white rounded-2xl flex justify-between items-center shadow-lg shadow-indigo-100">
                            <span className="font-black italic uppercase text-sm">{selectedCustomer.name}</span>
                            <button type="button" onClick={() => setSelectedCustomer(null)} className="text-indigo-200 hover:text-white"><X className="w-4 h-4" /></button>
                         </div>
                       ) : (
                         <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black" placeholder="SEARCH DATABASE..." value={customerSearch} onChange={e => searchCustomers(e.target.value)} />
                            {customers.length > 0 && customerSearch && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-50 italic">
                                 {customers.map(c => (
                                   <button key={c.id} type="button" onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomers([]); }} className="w-full text-left px-6 py-4 hover:bg-slate-50 text-[10px] font-black uppercase text-slate-900">{c.name}</button>
                                 ))}
                              </div>
                            )}
                         </div>
                       )}
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Tactical Location*</label>
                       <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase" placeholder="DESTINATION" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value.toUpperCase()})} />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section: Chrono Frame */}
           <div className="grid grid-cols-2 gap-8">
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1 italic">Deploy Date*</label>
                 <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black" value={formData.travel_date_start} onChange={e => setFormData({...formData, travel_date_start: e.target.value})} />
                 </div>
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1 italic">Extract Date*</label>
                 <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black" value={formData.travel_date_end} onChange={e => setFormData({...formData, travel_date_end: e.target.value})} />
                 </div>
              </div>
           </div>

           {/* Section: Logistics Mapping (Links) */}
           <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-2 underline decoration-indigo-100 decoration-4 underline-offset-4">Cross-Module Anchoring</h3>
              <div className="grid grid-cols-2 gap-6 italic">
                 <div>
                    <label className="text-[8px] font-black text-slate-300 uppercase mb-2 block tracking-widest">Proposal Link</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase" value={formData.quotation_id || ''} onChange={e => {
                       const q = quotations.find(x => x.id === e.target.value);
                       setFormData({ ...formData, quotation_id: e.target.value, selling_price: q?.total_amount || 0, cost_price: q?.total_vendor_cost || 0 });
                    }}>
                       <option value="">No Active Proposal</option>
                       {quotations.map(q => <option key={q.id} value={q.id}>{q.quote_number} — {q.title}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[8px] font-black text-slate-300 uppercase mb-2 block tracking-widest">Billing Anchor</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase" value={formData.invoice_id || ''} onChange={e => setFormData({ ...formData, invoice_id: e.target.value })}>
                       <option value="">No Revenue Node</option>
                       {invoices.map(i => <option key={i.id} value={i.id}>{i.invoice_number} — {i.title}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           {/* Section: Operational Overlays */}
           <div className="bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] p-10 text-white space-y-10 shadow-2xl shadow-slate-100 relative overflow-hidden">
              <ShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 opacity-5" />
              <div className="relative z-10 grid grid-cols-2 gap-12">
                 <div className="space-y-4">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest italic">Revenue Node (Authorized)</p>
                    <div className="flex items-center gap-4">
                       <IndianRupee className="w-8 h-8 text-white opacity-20" />
                       <input type="number" className="bg-transparent text-3xl font-black italic tracking-tighter w-full outline-none" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0})} />
                    </div>
                 </div>
                 {isAdmin && (
                   <div className="space-y-4">
                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest italic">Inventory Net Node</p>
                      <div className="flex items-center gap-4">
                         <IndianRupee className="w-8 h-8 text-white opacity-20" />
                         <input type="number" className="bg-transparent text-3xl font-black italic tracking-tighter w-full outline-none text-rose-400" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})} />
                      </div>
                   </div>
                 )}
              </div>
              <div className="pt-10 border-t border-white/5 flex gap-8">
                 <div className="flex-1">
                    <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-3 block italic">Protocol Priority</label>
                    <div className="flex gap-2">
                       {(['low', 'normal', 'high', 'urgent'] as BookingPriority[]).map(p => (
                         <button 
                           key={p} 
                           type="button" 
                           onClick={() => setFormData({...formData, priority: p})} 
                           className={clsx(
                             "flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all",
                             formData.priority === p ? "bg-white text-slate-900 border-white" : "border-white/10 text-white/40 hover:border-white/20"
                           )}
                         >
                            {p}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Footer Actions */}
           <div className="flex gap-4 pt-10 pb-20">
              <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all italic underline underline-offset-8">Abort Protocol</button>
              <button type="submit" disabled={isSaving} className="flex-2 px-16 py-4 bg-slate-900 text-white rounded-2xl font-black italic uppercase text-xs shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                 {isSaving ? 'Deploying...' : <><ShieldCheck className="w-5 h-5 text-emerald-400" /> Deploy Tactical Node</>}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};
