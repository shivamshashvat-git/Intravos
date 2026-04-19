import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { X, Globe, Calendar, FileText, Check, Search, User } from 'lucide-react';
import { itinerariesService } from '@/features/operations/services/itinerariesService';
import { customersService } from '@/features/crm/services/customersService';
import { useAuth } from '@/core/hooks/useAuth';

interface CreateItineraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTemplate?: any;
}

export const CreateItineraryDrawer: React.FC<CreateItineraryDrawerProps> = ({ isOpen, onClose, onSuccess, initialTemplate }) => {
  const navigate = useNavigate();
  const { tenant, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: initialTemplate?.title || '',
    destination: initialTemplate?.destination || '',
    start_date: '',
    end_date: '',
    option_label: '',
    lead_id: null as string | null,
    customer_id: null as string | null,
    customer_name: '',
    auto_create_days: true,
    day_count: initialTemplate?.days?.length || 5
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) { setSearchResults([]); return; }
    if (!tenant?.id) return;
    try {
      const { data } = await customersService.getCustomers(tenant.id, { search: val }, 1, 5);
      setSearchResults(data || []);
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    }
  };

  const selectCustomer = (c: any) => {
    setFormData({ ...formData, customer_id: c.id, customer_name: c.name });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user) return;
    setIsSaving(true);
    try {
      const itData = {
        tenant_id: tenant.id,
        title: formData.title,
        destination: formData.destination,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        option_label: formData.option_label || null,
        customer_id: formData.customer_id,
        lead_id: formData.lead_id,
        metadata: {
          agency_name: tenant.name,
          agency_logo_url: tenant.logo_url
          // agency_phone: tenant.agency_phone,
          // agency_email: tenant.agency_email
        }
      };

      let newIt;
      if (initialTemplate) {
         newIt = await itinerariesService.duplicateItinerary(initialTemplate.id, itData);
      } else {
         newIt = await itinerariesService.createItinerary(itData);
         if (formData.auto_create_days) {
            for (let i = 1; i <= formData.day_count; i++) {
                await itinerariesService.addDay(newIt.id, tenant.id, { 
                  day_number: i, 
                  sort_order: (i-1) * 10, 
                  title: `Day ${i}` 
                });
            }
         }
      }

      navigate(`/itineraries/${newIt.id}/edit`);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to initialize itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}></div>
       <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
             <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black italic uppercase text-slate-900">{initialTemplate ? 'Use Template' : 'New Itinerary'}</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Planning & Logistics Node</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                     <Globe className="w-4 h-4" /> Destination Intel
                   </h3>
                   <div className="space-y-3">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Itinerary Title*</label>
                         <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="e.g. Luxury Maldives Honeymoon" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Primary Destination</label>
                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Bali, France..." value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Option Label</label>
                            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold italic" placeholder="Option A" value={formData.option_label} onChange={e => setFormData({...formData, option_label: e.target.value})} />
                         </div>
                      </div>
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                     <Calendar className="w-4 h-4" /> Schedule Configuration
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Trip Start</label>
                         <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Trip End</label>
                         <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                      </div>
                   </div>
                   {!initialTemplate && (
                     <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                        <div>
                           <p className="text-xs font-black text-slate-900">Auto-initialize Days</p>
                           <p className="text-[10px] font-bold text-slate-400">Create blank day containers immediately</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <input type="number" min="1" max="30" className="w-12 p-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-center" value={formData.day_count} onChange={e => setFormData({...formData, day_count: parseInt(e.target.value) || 1})} />
                           <button type="button" onClick={() => setFormData({...formData, auto_create_days: !formData.auto_create_days})} className={clsx("w-10 h-6 rounded-full transition-all relative", formData.auto_create_days ? "bg-indigo-600" : "bg-slate-300")}>
                               <div className={clsx("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData.auto_create_days ? "right-1" : "left-1")}></div>
                           </button>
                        </div>
                     </div>
                   )}
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                     <User className="w-4 h-4" /> Guest Identity
                   </h3>
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" 
                        placeholder="Link Guest from CRM..."
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-50">
                           {searchResults.map(c => (
                             <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between">
                                <div><p className="text-xs font-black text-slate-900">{c.name}</p><p className="text-[10px] text-slate-400">{c.phone}</p></div>
                             </button>
                           ))}
                        </div>
                      )}
                   </div>
                   {formData.customer_name && (
                     <div className="bg-indigo-50 px-4 py-2 rounded-lg flex items-center justify-between text-indigo-700 text-[10px] font-black uppercase italic">
                        <span>{formData.customer_name} Linked</span>
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFormData({...formData, customer_id: null, customer_name: ''})} />
                     </div>
                   )}
                </section>
             </div>

             <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-white">
                <button type="button" onClick={onClose} className="text-xs font-black uppercase text-slate-400">Discard</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-10 py-3 bg-slate-900 text-white font-black rounded-xl text-xs uppercase italic shadow-xl shadow-slate-100 flex items-center gap-2 hover:bg-black transition-all active:scale-95"
                >
                   {isSaving ? 'Spinning up Node...' : (initialTemplate ? 'Apply Template' : 'Initialize Itinerary')}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};
