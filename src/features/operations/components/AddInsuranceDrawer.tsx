import React, { useState } from 'react';
import { 
  X, ShieldCheck, Loader2, ArrowRight, Shield, 
  Calendar, Hash, Wallet, FileText 
} from 'lucide-react';
import { insuranceService, InsurancePolicy } from '../services/insuranceService';
import { CustomerSelector } from '@/shared/components/CustomerSelector';
import { toast } from 'sonner';

interface AddInsuranceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId?: string;
  customerId?: string;
}

export const AddInsuranceDrawer: React.FC<AddInsuranceDrawerProps> = ({ 
  isOpen, onClose, onSuccess, bookingId, customerId 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: customerId || '',
    booking_id: bookingId || '',
    provider_name: '',
    policy_number: '',
    coverage_type: 'medical' as const,
    premium_amount: 0,
    coverage_start: '',
    coverage_end: '',
    status: 'active' as const,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) return toast.error('Customer selection required');
    if (!formData.provider_name || !formData.policy_number) return toast.error('Policy details required');
    if (!formData.coverage_start || !formData.coverage_end) return toast.error('Coverage window required');

    setLoading(true);
    try {
      await insuranceService.createPolicy(formData);
      toast.success('Coverage Protocol Initialized');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Initialization failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl animate-in slide-in-from-right duration-500 h-screen flex flex-col italic">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">Risk Governance</p>
             <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Issue New Policy</h2>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all"><X className="w-5 h-5 text-slate-300" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
           {/* Customer Linkage */}
           {!customerId && (
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Customer Node*</label>
                <CustomerSelector 
                  onSelect={(c) => setFormData({ ...formData, customer_id: c?.id || '' })} 
                  placeholder="Link traveler node..."
                />
             </div>
           )}

           {/* Provider & Policy */}
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Provider Entity*</label>
                 <input 
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm"
                   placeholder="e.g., TATA AIG"
                   value={formData.provider_name}
                   onChange={e => setFormData({ ...formData, provider_name: e.target.value })}
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Policy Number*</label>
                 <input 
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black"
                   placeholder="e.g., PL-902341"
                   value={formData.policy_number}
                   onChange={e => setFormData({ ...formData, policy_number: e.target.value.toUpperCase() })}
                 />
              </div>
           </div>

           {/* Financials & Type */}
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Premium (INR)</label>
                 <input 
                   type="number"
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-emerald-100 transition-all font-black text-emerald-600"
                   value={formData.premium_amount}
                   onChange={e => setFormData({ ...formData, premium_amount: Number(e.target.value) })}
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Coverage Scope</label>
                 <select 
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black uppercase text-xs"
                   value={formData.coverage_type}
                   onChange={e => setFormData({ ...formData, coverage_type: e.target.value as any })}
                 >
                    <option value="medical">Medical Only</option>
                    <option value="trip">Trip Protection</option>
                    <option value="both">Comprehensive (Both)</option>
                 </select>
              </div>
           </div>

           {/* Terminal Window */}
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Start Window*</label>
                 <input 
                   type="date"
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none transition-all font-bold text-xs"
                   value={formData.coverage_start}
                   onChange={e => setFormData({ ...formData, coverage_start: e.target.value })}
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">End Window*</label>
                 <input 
                   type="date"
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none transition-all font-bold text-xs"
                   value={formData.coverage_end}
                   onChange={e => setFormData({ ...formData, coverage_end: e.target.value })}
                 />
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Note Log</label>
              <textarea 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold min-h-[100px]"
                placeholder="Operational notes concerning policy exclusions or claims..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
           </div>
        </form>

        <div className="p-8 border-t border-slate-100 space-y-4">
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl italic uppercase text-xs shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Initialize Protocol</>}
           </button>
           <button onClick={onClose} className="w-full py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900 transition-colors text-center">Abort Deployment</button>
        </div>
      </div>
    </div>
  );
};
