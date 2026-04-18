import React, { useState, useEffect } from 'react';
import { 
  X, Save, Plus, Trash2, MapPin, 
  ChevronDown, ChevronUp, GripVertical, 
  BedDouble, Car, Compass, UtensilsCrossed, Plane, Camera,
  HelpCircle, Clock, Info, ExternalLink, Zap
} from 'lucide-react';
import { 
  ItineraryTemplate, CreateTemplateInput, 
  CATEGORY_LABELS, TemplateCategory 
} from '../types/knowledgeBank';
import { ItineraryItemType } from '../types/itinerary';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  template?: ItineraryTemplate | null;
}

const ACTIVITY_TYPES: { type: ItineraryItemType; label: string; icon: any }[] = [
  { type: 'hotel', label: 'Hotel', icon: BedDouble },
  { type: 'transfer', label: 'Transfer', icon: Car },
  { type: 'activity', label: 'Activity', icon: Compass },
  { type: 'meal', label: 'Meal', icon: UtensilsCrossed },
  { type: 'flight', label: 'Flight', icon: Plane },
  { type: 'sightseeing', label: 'Sightseeing', icon: Camera },
];

export const TemplateFormDrawer: React.FC<Props> = ({ isOpen, onClose, onSubmit, template }) => {
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    category: 'custom' as TemplateCategory,
    description: '',
    tags: '',
    duration_days: 1,
    base_price_per_person: 0,
    is_public: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        destination: template.destination || '',
        category: template.category || 'custom',
        description: template.description || '',
        tags: (template.tags || []).join(', '),
        duration_days: template.duration_days || template.total_days || 1,
        base_price_per_person: Number(template.base_price_per_person || 0),
        is_public: !!template.is_public
      });
    } else {
      setFormData({
        title: '',
        destination: '',
        category: 'custom',
        description: '',
        tags: '',
        duration_days: 3, // Default to a reasonable start
        base_price_per_person: 0,
        is_public: false
      });
    }
  }, [template, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await onSubmit(data);
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto italic no-scrollbar">
        <header className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
           <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-950">
                {template ? 'Modify Blueprint' : 'Initialize Master Blueprint'}
              </h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Knowledge Bank Entry v1.0</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
              <X className="w-6 h-6" />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="p-10 space-y-12 pb-40">
           {/* Section 1: Identity */}
           <div className="space-y-10">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                 <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">Blueprint Identity</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-8 px-2">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Blueprint Title*</label>
                    <input 
                      required
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      placeholder="e.g. 7-Day Rajasthan Heritage Circuit"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Destinations*</label>
                       <div className="relative">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            required
                            className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                            placeholder="City, Region, or Route"
                            value={formData.destination}
                            onChange={e => setFormData({ ...formData, destination: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Category*</label>
                       <select 
                         className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                         value={formData.category}
                         onChange={e => setFormData({ ...formData, category: e.target.value as TemplateCategory })}
                       >
                          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Blueprint Narrative</label>
                    <textarea 
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all h-24 resize-none"
                      placeholder="Ideal traveler profile, best season, and key USPs..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Neural Tags</label>
                    <input 
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      placeholder="Tag keywords separated by commas..."
                      value={formData.tags}
                      onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    />
                 </div>
              </div>
           </div>

           {/* Section 2: Commercials */}
           <div className="space-y-10">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                 <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">Commercial Parameters</h3>
              </div>

              <div className="grid grid-cols-2 gap-8 px-2">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Duration (Days)*</label>
                    <div className="relative">
                       <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                         type="number"
                         required
                         min={1}
                         className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                         value={formData.duration_days}
                         onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                       />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Baseline Price (per person)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300">₹</span>
                       <input 
                         type="number"
                         className="w-full pl-12 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                         value={formData.base_price_per_person}
                         onChange={e => setFormData({ ...formData, base_price_per_person: Number(e.target.value) })}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 text-white flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-indigo-400">
                       <Zap className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Marketplace Listing</p>
                       <p className="text-[9px] font-bold text-white/30 uppercase mt-1">Share with Intravos network partners</p>
                    </div>
                 </div>
                 <input 
                   type="checkbox"
                   className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-indigo-500 focus:ring-0 cursor-pointer"
                   checked={formData.is_public}
                   onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                 />
              </div>
           </div>

           <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 italic space-y-4">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Protocol Note</p>
              <p className="text-[11px] font-bold text-slate-600 tracking-wide leading-relaxed">
                 Saving this blueprint will register it as a master sequence. You can add more detailed day-by-day itineraries and photos later via the primary Itinerary Builder tools.
              </p>
           </div>

           <button 
             disabled={isSubmitting || !formData.title || !formData.destination}
             className="w-full py-6 bg-slate-950 text-white rounded-[2rem] text-sm font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
           >
              {isSubmitting ? 'Syncing Repository...' : <>{template ? 'Update Master Blueprint' : 'Commit Blueprint to Bank'} <Save className="w-5 h-5" /></>}
           </button>
        </form>
      </div>
    </div>
  );
};
