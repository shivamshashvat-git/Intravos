import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Tag } from 'lucide-react';
import { customersService } from '@/features/crm/services/customersService';
import { useAuth } from '@/core/hooks/useAuth';
import { Customer, CustomerType } from '@/features/crm/types/customer';

interface CreateCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: Customer) => void;
  initialData?: Partial<Customer>;
}

export const CreateCustomerDrawer: React.FC<CreateCustomerDrawerProps> = ({ 
  isOpen, onClose, onSuccess, initialData 
}) => {
  const { user, tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    alt_phone: '',
    email: initialData?.email || '',
    customer_type: 'individual' as CustomerType,
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    date_of_birth: '',
    wedding_anniversary: '',
    gender: 'male' as 'male'|'female'|'other',
    preferred_destinations: '',
    preferred_airlines: '',
    preferred_hotel_class: '4_star' as any,
    dietary_preferences: '',
    special_needs: '',
    notes: '',
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialData) {
        setFormData(prev => ({ 
          ...prev, 
          name: initialData.name || '', 
          phone: initialData.phone || '', 
          email: initialData.email || '' 
        }));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, initialData]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    if (!tenant?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const newCustomer = await customersService.createCustomer({
        ...formData,
        tenant_id: tenant.id,
        created_by: user?.id,
        date_of_birth: formData.date_of_birth || null,
        wedding_anniversary: formData.wedding_anniversary || null,
        // Ensure nulls for empty strings
        email: formData.email || null,
        alt_phone: formData.alt_phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        preferred_destinations: formData.preferred_destinations || null,
        preferred_airlines: formData.preferred_airlines || null,
        dietary_preferences: formData.dietary_preferences || null,
        special_needs: formData.special_needs || null,
        notes: formData.notes || null,
      });

      onSuccess(newCustomer);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
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
          <h2 className="text-xl font-bold text-slate-900">Add Customer</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           <form id="create-customer-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Details */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-2 py-1 rounded">Contact Details</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name*</label>
                      <input 
                        type="text" required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phone*</label>
                      <input 
                        type="tel" required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Alt Phone</label>
                      <input 
                        type="tel"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                        value={formData.alt_phone} onChange={e => setFormData({...formData, alt_phone: e.target.value})}
                      />
                   </div>
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label>
                      <input 
                        type="email"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                   </div>
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Customer Type</label>
                      <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                         <button type="button" onClick={() => setFormData({...formData, customer_type: 'individual'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.customer_type === 'individual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Individual</button>
                         <button type="button" onClick={() => setFormData({...formData, customer_type: 'corporate'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.customer_type === 'corporate' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Corporate</button>
                      </div>
                   </div>
                </div>
              </section>

              {/* Address */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-2 py-1 rounded">Address</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 h-20 text-sm" placeholder="Full Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                   <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="City" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                      <input type="text" placeholder="State" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                      <input type="text" placeholder="Pincode" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                      <input type="text" placeholder="Country" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                   </div>
                </div>
              </section>

              {/* Personal Info */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-2 py-1 rounded">Personal Info</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wedding Anniversary</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white" value={formData.wedding_anniversary} onChange={e => setFormData({...formData, wedding_anniversary: e.target.value})} />
                   </div>
                   <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</label>
                      <select className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                         <option value="male">Male</option>
                         <option value="female">Female</option>
                         <option value="other">Other</option>
                      </select>
                   </div>
                </div>
              </section>

              {/* Travel Preferences */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-2 py-1 rounded">Travel Preferences</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <input type="text" placeholder="Preferred Destinations" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={formData.preferred_destinations} onChange={e => setFormData({...formData, preferred_destinations: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                       <input type="text" placeholder="Preferred Airlines" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={formData.preferred_airlines} onChange={e => setFormData({...formData, preferred_airlines: e.target.value})} />
                       <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white" value={formData.preferred_hotel_class} onChange={e => setFormData({...formData, preferred_hotel_class: e.target.value as any})}>
                          <option value="budget">Budget</option>
                          <option value="3_star">3 Star</option>
                          <option value="4_star">4 Star</option>
                          <option value="5_star">5 Star</option>
                          <option value="luxury">Luxury</option>
                       </select>
                    </div>
                    <textarea placeholder="Dietary Preferences" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 h-16 text-sm" value={formData.dietary_preferences} onChange={e => setFormData({...formData, dietary_preferences: e.target.value})} />
                </div>
              </section>

              {/* Tags & Notes */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-4 bg-indigo-50 inline-block px-2 py-1 rounded">Tags & Notes</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                       <div className="flex flex-wrap gap-2 mb-2">
                          {formData.tags.map(t => (
                            <span key={t} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1 border border-indigo-200 animate-in zoom-in duration-200">
                               {t}
                               <button type="button" onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                       </div>
                       <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="text"
                            placeholder="Type tag and press Enter"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                          />
                       </div>
                    </div>
                    <textarea placeholder="Additional Notes" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 h-24 text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </section>

              {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{error}</div>}
           </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button 
            type="submit" form="create-customer-form" disabled={isLoading}
            className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
};
