import React, { useState, useEffect } from 'react';
import { X, Globe, User, Phone, Hash, CreditCard, Clock, Calendar, Bookmark, Activity } from 'lucide-react';
import { useVisaList } from '../hooks/useVisaList';
import { useAuth } from '@/core/hooks/useAuth';
import { VisaTracking, VisaStatus, PassportCustody } from '../types/visa';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface CreateVisaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<VisaTracking>;
}

export const CreateVisaDrawer: React.FC<CreateVisaDrawerProps> = ({ isOpen, onClose, initialData }) => {
  const { tenant, user } = useAuth();
  const { createVisa } = useVisaList();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<VisaTracking>>({
    traveler_name: '',
    nationality: 'Indian',
    passport_country: 'India',
    visa_country: '',
    visa_type: 'tourist',
    visa_category: 'single',
    entry_type: 'sticker',
    visa_fee: 0,
    service_charge: 0,
    status: 'documents_pending',
    passport_custody: 'with_client',
    ...initialData
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.traveler_name || !formData.visa_country) return toast.error('Traveler and Target Country Required');
    
    setIsSubmitting(true);
    try {
      await createVisa({
        ...formData,
        created_by: user?.id,
        total_amount: Number(formData.visa_fee || 0) + Number(formData.service_charge || 0)
      } as any);
      toast.success('Visa Node Initialized Successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto italic">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
           <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-950">Initialize Visa Node</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Operational Application Entry</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-12 pb-40">
           {/* Section: Traveler */}
           <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                 <User className="w-4 h-4" /> Personnel Authentication
              </h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Traveler Legal Name*</label>
                    <input 
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-tight focus:ring-4 focus:ring-indigo-50" 
                      placeholder="NAME AS PER PASSPORT"
                      value={formData.traveler_name}
                      onChange={e => setFormData({ ...formData, traveler_name: e.target.value.toUpperCase() })}
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Passport Number</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-50" 
                      placeholder="L1234567"
                      value={formData.passport_number || ''}
                      onChange={e => setFormData({ ...formData, passport_number: e.target.value.toUpperCase() })}
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Passport Expiry</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-tighter focus:ring-4 focus:ring-indigo-50" 
                      value={formData.passport_expiry || ''}
                      onChange={e => setFormData({ ...formData, passport_expiry: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Nationality</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-50" 
                      value={formData.nationality || ''}
                      onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Comm Node (Phone)</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black tracking-widest focus:ring-4 focus:ring-indigo-50" 
                      placeholder="+91"
                      value={formData.traveler_phone || ''}
                      onChange={e => setFormData({ ...formData, traveler_phone: e.target.value })}
                    />
                 </div>
              </div>
           </div>

           {/* Section: Visa Details */}
           <div className="space-y-6 pt-10 border-t border-slate-50">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                 <Globe className="w-4 h-4" /> Global Objective
              </h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Target Country*</label>
                    <input 
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-tight focus:ring-4 focus:ring-emerald-50" 
                      placeholder="UNITED STATES, TURKEY, ETC."
                      value={formData.visa_country}
                      onChange={e => setFormData({ ...formData, visa_country: e.target.value.toUpperCase() })}
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Visa Type</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-widest"
                      value={formData.visa_type || ''}
                      onChange={e => setFormData({ ...formData, visa_type: e.target.value })}
                    >
                       <option value="tourist">Tourist</option>
                       <option value="business">Business</option>
                       <option value="transit">Transit</option>
                       <option value="student">Student</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Entry Configuration</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-widest"
                      value={formData.entry_type || ''}
                      onChange={e => setFormData({ ...formData, entry_type: e.target.value })}
                    >
                       <option value="sticker">Sticker Visa</option>
                       <option value="e-visa">E-Visa</option>
                       <option value="voa">VOA / On Arrival</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Target Travel Date</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-tighter focus:ring-4 focus:ring-emerald-50" 
                      value={formData.travel_date || ''}
                      onChange={e => setFormData({ ...formData, travel_date: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Duration</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black uppercase tracking-widest" 
                      placeholder="e.g. 30 DAYS"
                      value={formData.visa_duration || ''}
                      onChange={e => setFormData({ ...formData, visa_duration: e.target.value })}
                    />
                 </div>
              </div>
           </div>

           {/* Section: Financials */}
           <div className="space-y-6 pt-10 border-t border-slate-50">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                 <CreditCard className="w-4 h-4" /> Monetary Setup
              </h3>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2rem]">
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Consulate / Visa Fee</label>
                    <input 
                      type="number"
                      className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-black tracking-widest outline-none" 
                      value={formData.visa_fee}
                      onChange={e => setFormData({ ...formData, visa_fee: Number(e.target.value) })}
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Agency Service Charge</label>
                    <input 
                      type="number"
                      className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-black tracking-widest outline-none" 
                      value={formData.service_charge}
                      onChange={e => setFormData({ ...formData, service_charge: Number(e.target.value) })}
                    />
                 </div>
                 <div className="col-span-2 pt-4 border-t border-slate-200 mt-4 flex justify-between items-center px-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Authorized Total Pipeline Revenue:</span>
                    <span className="text-xl font-black text-indigo-600">₹{((formData.visa_fee || 0) + (formData.service_charge || 0)).toLocaleString('en-IN')}</span>
                 </div>
              </div>
           </div>

           {/* Section: Context Link */}
           <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-50">
              <div className="col-span-2">
                 <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block italic">Internal Notes & Operations Directives</label>
                 <textarea 
                   className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-slate-600 outline-none h-32 focus:ring-4 focus:ring-slate-100"
                   placeholder="Log specific handling instructions..."
                   value={formData.notes || ''}
                   onChange={e => setFormData({ ...formData, notes: e.target.value })}
                 />
              </div>
           </div>

           <div className="fixed bottom-0 right-0 w-full max-w-2xl p-8 bg-white border-t border-slate-50 flex gap-4 backdrop-blur-md">
              <button type="button" onClick={onClose} className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-all">Abort Deployment</button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-3xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                <Activity className="w-4 h-4 text-emerald-400" /> {isSubmitting ? 'Initializing Node...' : 'Commit Visa Node'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};
