import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Wallet, Calendar, Hash, FileText, 
  ArrowRight, ShieldCheck, Landmark, CreditCard, 
  Banknote, Sparkles, CheckCircle2 
} from 'lucide-react';
import { VendorSummary, SupplierService, PaymentMethod } from '../types/vendorLedger';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: VendorSummary | null;
  services: SupplierService[];
  onSubmit: (data: any) => Promise<void>;
  preselectedServiceId?: string;
}

export const RecordVendorPaymentDrawer: React.FC<Props> = ({ 
  isOpen, onClose, supplier, services, onSubmit, preselectedServiceId 
}) => {
  const [formData, setFormData] = useState({
    bookingServiceId: '',
    amount: 0,
    paymentMethod: 'bank_transfer' as PaymentMethod,
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter services to only show unpaid/partial
  const eligibleServices = useMemo(() => {
    return services.filter(s => s.supplier_payment_status !== 'paid');
  }, [services]);

  useEffect(() => {
    if (preselectedServiceId) {
      const s = services.find(x => x.id === preselectedServiceId);
      if (s) {
        setFormData(prev => ({
          ...prev,
          bookingServiceId: s.id,
          amount: Number(s.cost_price) - Number(s.paid_to_supplier)
        }));
      }
    } else if (supplier) {
       setFormData(prev => ({
         ...prev,
         amount: supplier.outstanding
       }));
    }
  }, [preselectedServiceId, services, supplier, isOpen]);

  const outstandingAfter = useMemo(() => {
    const currentOutstanding = preselectedServiceId 
      ? (Number(services.find(s => s.id === formData.bookingServiceId)?.cost_price) || 0) - (Number(services.find(s => s.id === formData.bookingServiceId)?.paid_to_supplier) || 0)
      : supplier?.outstanding || 0;
    
    return Math.max(0, currentOutstanding - formData.amount);
  }, [formData.amount, formData.bookingServiceId, supplier, services, preselectedServiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        supplierId: supplier.id,
        ...formData
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto italic">
        <header className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
           <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-950">Record Settlement</h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Vendor Payment Protocol Initiated</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
              <X className="w-6 h-6" />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="p-10 space-y-12 pb-40">
           {/* Context Card */}
           <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
              <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:rotate-12 transition-all duration-700" />
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Target Supplier</p>
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">{supplier.name}</h3>
                 <div className="flex items-center gap-2 mt-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">{supplier.supplier_type}</span>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">{supplier.city || 'GLOBAL'}</span>
                 </div>
              </div>
           </div>

           {/* Service Selection */}
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Service Allocation (Optional)</label>
              <select 
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                value={formData.bookingServiceId}
                onChange={e => {
                  const s = services.find(x => x.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    bookingServiceId: e.target.value,
                    amount: s ? (Number(s.cost_price) - Number(s.paid_to_supplier)) : (supplier?.outstanding || 0)
                  }));
                }}
              >
                 <option value="">Lump Sum Payment (Unallocated)</option>
                 {eligibleServices.map(s => (
                   <option key={s.id} value={s.id}>
                     {s.booking_ref} | {s.title} (Bal: {formatINR(s.cost_price - s.paid_to_supplier)})
                   </option>
                 ))}
              </select>
           </div>

           {/* Financials */}
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Payment Amount*</label>
                 <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">₹</span>
                    <input 
                      type="number"
                      required
                      className="w-full px-12 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xl font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    />
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Payment Date*</label>
                 <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      type="date"
                      required
                      className="w-full px-16 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      value={formData.paymentDate}
                      onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                 </div>
              </div>
           </div>

           {/* Method & Ref */}
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Payment Method*</label>
                 <select 
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                 >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                 </select>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Reference Number</label>
                 <div className="relative">
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input 
                      className="w-full px-14 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-200"
                      placeholder="TXN_ID / CHQ_NUM"
                      value={formData.referenceNumber}
                      onChange={e => setFormData({ ...formData, referenceNumber: e.target.value.toUpperCase() })}
                    />
                 </div>
              </div>
           </div>

           {/* Notes */}
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Internal Notes</label>
              <textarea 
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all h-32 resize-none"
                placeholder="Logged reason for this disbursement..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
           </div>

           {/* Footer Stats */}
           <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-center justify-between">
              <div>
                 <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Post-Payment Latency</p>
                 <p className={clsx(
                   "text-2xl font-black italic tracking-tighter",
                   outstandingAfter === 0 ? "text-emerald-600" : "text-indigo-900"
                 )}>
                   {formatINR(outstandingAfter)}
                 </p>
              </div>
              {outstandingAfter === 0 && (
                <div className="flex items-center gap-2 text-emerald-600">
                   <CheckCircle2 className="w-6 h-6" />
                   <span className="text-[10px] font-black uppercase tracking-widest italic">Node Settled</span>
                </div>
              )}
           </div>

           {/* Action */}
           <button 
             disabled={isSubmitting || formData.amount <= 0}
             className="w-full py-6 bg-slate-950 text-white rounded-3xl text-sm font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
           >
              {isSubmitting ? 'Pushing Data...' : <>Confirm Disbursement <ArrowRight className="w-5 h-5" /></>}
           </button>
        </form>
      </div>
    </div>
  );
};
