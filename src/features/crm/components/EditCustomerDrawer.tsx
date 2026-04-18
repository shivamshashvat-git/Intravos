import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Search, User } from 'lucide-react';
import { customersService } from '@/features/crm/services/customersService';
import { useAuth } from '@/core/hooks/useAuth';
import { Customer, CustomerType } from '@/features/crm/types/customer';
import { supabase } from '@/core/lib/supabase';

interface EditCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSuccess: (updatedCustomer: Customer) => void;
}

export const EditCustomerDrawer: React.FC<EditCustomerDrawerProps> = ({ 
  isOpen, onClose, customer, onSuccess 
}) => {
  const { tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrerSearch, setReferrerSearch] = useState('');
  const [referrerResults, setReferrerResults] = useState<{ id: string, name: string }[]>([]);
  
  const [formData, setFormData] = useState({ ...customer });
  const [importantDates, setImportantDates] = useState(customer.important_dates || []);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...customer });
      setImportantDates(customer.important_dates || []);
    }
  }, [isOpen, customer]);

  // Handle Referrer Search
  useEffect(() => {
    if (referrerSearch.length < 2) {
      setReferrerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name')
        .eq('tenant_id', tenant?.id)
        .neq('id', customer.id)
        .ilike('name', `%${referrerSearch}%`)
        .limit(5);
      setReferrerResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [referrerSearch, tenant?.id, customer.id]);

  const handleAddDate = () => {
    setImportantDates([...importantDates, { label: '', date: '', type: 'other' }]);
  };

  const removeDate = (idx: number) => {
    setImportantDates(importantDates.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updated = await customersService.updateCustomer(customer.id, {
        ...formData,
        important_dates: importantDates,
        // Enforce types and nulls
        passport_expiry: formData.passport_expiry || null,
        date_of_birth: formData.date_of_birth || null,
        wedding_anniversary: formData.wedding_anniversary || null,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Profile: {customer.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           <form id="edit-customer-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Identity & Compliance - Edit Real Values */}
              <section>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-2 py-1 rounded">Identity & Compliance</h3>
                 <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Passport Number</label>
                       <input className="w-full px-3 py-2 border rounded-lg" value={formData.passport_number || ''} onChange={e => setFormData({...formData, passport_number: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Passport Expiry</label>
                       <input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.passport_expiry || ''} onChange={e => setFormData({...formData, passport_expiry: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase">PAN Number</label>
                       <input className="w-full px-3 py-2 border rounded-lg" value={formData.pan_number || ''} onChange={e => setFormData({...formData, pan_number: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase">GST Number</label>
                       <input className="w-full px-3 py-2 border rounded-lg" value={formData.gst_number || ''} onChange={e => setFormData({...formData, gst_number: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Aadhar Number</label>
                       <input className="w-full px-3 py-2 border rounded-lg" value={formData.aadhar_number || ''} onChange={e => setFormData({...formData, aadhar_number: e.target.value})} />
                    </div>
                 </div>
              </section>

              {/* Referrer */}
              <section>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-2 py-1 rounded">Referral</h3>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                         className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                         placeholder="Search referrer by name..." 
                         value={referrerSearch}
                         onChange={e => setReferrerSearch(e.target.value)}
                       />
                    </div>
                    {referrerResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2">
                         {referrerResults.map(r => (
                           <button 
                             key={r.id} 
                             type="button" 
                             onClick={() => { setFormData({...formData, referred_by: r.id}); setReferrerSearch(''); setReferrerResults([]); }}
                             className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2"
                           >
                             <User className="w-3 h-3 text-slate-400" /> {r.name}
                           </button>
                         ))}
                      </div>
                    )}
                    {formData.referred_by && (
                      <div className="mt-3 flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-100 text-indigo-700 font-bold text-xs uppercase">
                         <span>Linked to: ID #{formData.referred_by.slice(0, 8)}</span>
                         <button type="button" onClick={() => setFormData({...formData, referred_by: null})}><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    )}
                 </div>
              </section>

              {/* Important Dates */}
              <section>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">Important Dates</h3>
                   <button type="button" onClick={handleAddDate} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Date</button>
                </div>
                <div className="space-y-3">
                   {importantDates.map((d, i) => (
                     <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in slide-in-from-left-2 duration-200">
                        <select className="px-2 py-1.5 border rounded-lg bg-white text-xs font-bold" value={d.type} onChange={e => {
                           const NewDates = [...importantDates];
                           NewDates[i].type = e.target.value as any;
                           setImportantDates(NewDates);
                        }}>
                           <option value="birthday">Birthday</option>
                           <option value="anniversary">Anniversary</option>
                           <option value="other">Other</option>
                        </select>
                        <input className="flex-1 px-3 py-1.5 border rounded-lg bg-white text-xs" placeholder="Label" value={d.label} onChange={e => {
                           const NewDates = [...importantDates];
                           NewDates[i].label = e.target.value;
                           setImportantDates(NewDates);
                        }} />
                        <input type="date" className="px-2 py-1.5 border rounded-lg bg-white text-xs" value={d.date} onChange={e => {
                           const NewDates = [...importantDates];
                           NewDates[i].date = e.target.value;
                           setImportantDates(NewDates);
                        }} />
                        <button type="button" onClick={() => removeDate(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   ))}
                </div>
              </section>
           </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
           <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500">Cancel</button>
           <button type="submit" form="edit-customer-form" disabled={isLoading} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />} Save Progress
           </button>
        </div>
      </div>
    </div>
  );
};
