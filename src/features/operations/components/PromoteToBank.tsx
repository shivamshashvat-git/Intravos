import React, { useState, useEffect } from 'react';
import { 
  X, Save, Upload, Info, ShieldCheck, 
  MapPin, Clock, Banknote, HelpCircle, Zap
} from 'lucide-react';
import { 
  CATEGORY_LABELS, TemplateCategory, CreateTemplateInput, CATEGORY_COLORS 
} from '../types/knowledgeBank';
import { ItineraryWithDetails } from '../types/itinerary';
import { itinerariesService } from '../services/itinerariesService';
import { formatINR } from '@/utils/currency';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  itinerary: ItineraryWithDetails;
}

export const PromoteToBank: React.FC<Props> = ({ isOpen, onClose, itinerary }) => {
  const [formData, setFormData] = useState<CreateTemplateInput>({
    title: '',
    destination: '',
    category: 'custom' as TemplateCategory,
    description: '',
    tags: [] as string[],
    duration_days: 1,
    base_price_per_person: 0,
    is_public: false
  });

  const [tagString, setTagString] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itinerary && isOpen) {
      setFormData({
        title: itinerary.title + ' Master',
        destination: itinerary.destination || '',
        category: 'custom',
        description: itinerary.notes || '',
        tags: [],
        duration_days: itinerary.days.length,
        base_price_per_person: 0,
        is_public: false
      });
      setTagString('');
    }
  }, [itinerary, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await itinerariesService.promoteToTemplate(itinerary.id, {
        ...formData,
        tags: tagString.split(',').map(t => t.trim()).filter(Boolean),
        duration_days: itinerary.days.length
      });

      toast.success('Blueprint successfully promoted to Knowledge Bank');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Promotion sequence failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end italic">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col overflow-hidden">
        <header className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0">
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <Upload className="w-5 h-5 text-indigo-600" />
                 <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-950 leading-none">Promote to Bank</h2>
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mt-2">Convert active sequence into reusable master blueprint</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-950 rounded-2xl transition-all">
              <X className="w-6 h-6" />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12 pb-40">
           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 italic space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 <p className="text-[11px] font-black uppercase text-emerald-600 tracking-widest">Aseptic Transfer Protocol</p>
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed px-2">
                 A sanitized copy of this itinerary will be saved to the repository. The system will automatically strip lead identifiers, client names, and specific booking references to preserve master blueprint integrity.
              </p>
           </div>

           {/* Section 1: Template Identity */}
           <div className="space-y-10">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                 <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">Template Identity</h3>
              </div>

              <div className="grid grid-cols-1 gap-8">
                 <div className="space-y-3 px-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Blueprint Designation*</label>
                    <input 
                      required
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black uppercase italic outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      placeholder="e.g. 7-DAY RAJASTHAN MASTER"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                    <p className="text-[8px] font-bold uppercase text-slate-300 ml-6 tracking-widest">Recommended: Remove client names or dates</p>
                 </div>

                 <div className="grid grid-cols-2 gap-6 px-2">
                    <div className="space-y-3">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Sectors Covered</label>
                       <div className="relative">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            required
                            className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                            value={formData.destination}
                            onChange={e => setFormData({ ...formData, destination: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Blueprint Class*</label>
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

                 <div className="space-y-3 px-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Operational Summary</label>
                    <textarea 
                       className="w-full h-24 px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-bold text-slate-500 outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                       placeholder="Specify ideal traveler profile and mission focus..."
                       value={formData.description || ''}
                       onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                 </div>

                 <div className="space-y-3 px-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Indexing Tags (Comma separated)</label>
                    <input 
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      placeholder="e.g. BALI, HONEYMOON, 5-DAY"
                      value={tagString}
                      onChange={e => setTagString(e.target.value)}
                    />
                 </div>
              </div>
           </div>

           {/* Section 2: Economics */}
           <div className="space-y-10">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                 <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.2em]">Commercial Baseline</h3>
              </div>

              <div className="grid grid-cols-2 gap-8 px-2">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Sequence Duration</label>
                    <div className="relative">
                       <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <div className="w-full pl-14 pr-8 py-5 bg-slate-100 border border-slate-200 rounded-3xl text-sm font-black text-slate-400 italic">
                          {itinerary.days.length} Strategic Nodes
                       </div>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Base Market Price (INR)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300">₹</span>
                       <input 
                         type="number"
                         className="w-full pl-12 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                         value={formData.base_price_per_person || 0}
                         onChange={e => setFormData({ ...formData, base_price_per_person: Number(e.target.value) })}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white flex items-center justify-between border border-white/5 shadow-2xl shadow-indigo-100">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                       <Zap className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Marketplace Exposure</p>
                       <p className="text-[8px] font-bold text-white/30 uppercase mt-1">Authorized for network discovery</p>
                    </div>
                 </div>
                 <input 
                   type="checkbox"
                   className="w-6 h-6 rounded-lg bg-white/5 border-white/10 text-indigo-500 focus:ring-0"
                   checked={formData.is_public}
                   onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                 />
              </div>
           </div>

           <button 
             disabled={isSubmitting || !formData.title}
             type="submit"
             className="w-full py-6 bg-slate-950 text-white rounded-[2rem] text-sm font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
           >
              {isSubmitting ? (
                 <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              ) : (
                 <>Commit to Knowledge Bank <Upload className="w-5 h-5" /></>
              )}
           </button>
        </form>
      </div>
    </div>
  );
};
