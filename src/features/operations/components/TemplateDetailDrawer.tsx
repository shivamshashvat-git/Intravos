import React, { useState, useEffect } from 'react';
import { 
  X, Compass, BedDouble, Car, UtensilsCrossed, Plane, Camera, 
  MapPin, Clock, Banknote, Calendar, ChevronRight, Layout,
  Copy, Edit3, Trash2, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { 
  DetailedTemplate, CATEGORY_LABELS, CATEGORY_COLORS 
} from '../types/knowledgeBank';
import { ItineraryItemType } from '../types/itinerary';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { knowledgeBankService } from '../services/knowledgeBankService';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
  onEdit: (template: any) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const ACTIVITY_ICONS: Record<string, any> = {
  hotel: BedDouble,
  transfer: Car,
  activity: Compass,
  meal: UtensilsCrossed,
  flight: Plane,
  sightseeing: Camera,
  other: Layout
};

export const TemplateDetailDrawer: React.FC<Props> = ({ 
  isOpen, onClose, templateId, onEdit, onDuplicate, onDelete 
}) => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<DetailedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (templateId && isOpen) {
      loadTemplate(templateId);
    }
  }, [templateId, isOpen]);

  const loadTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await knowledgeBankService.getTemplate(id);
      setTemplate(data);
      if (data.days?.length > 0) {
        setExpandedDays(new Set([data.days[0].id]));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayId: string) => {
    const next = new Set(expandedDays);
    if (next.has(dayId)) next.delete(dayId);
    else next.add(dayId);
    setExpandedDays(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end italic">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto no-scrollbar">
        {isLoading || !template ? (
           <div className="h-full flex items-center justify-center font-black uppercase text-slate-300 tracking-[0.2em]">
              Hydrating Blueprint Matrix...
           </div>
        ) : (
           <div className="pb-32">
              {/* Header */}
              <header className="p-10 border-b border-slate-50 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                 
                 <div className="relative z-10 flex justify-between items-start mb-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <span className={clsx(
                             "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                             CATEGORY_COLORS[template.category]
                          )}>
                             {CATEGORY_LABELS[template.category]}
                          </span>
                       </div>
                       <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-950 leading-none max-w-xl">
                          {template.title}
                       </h2>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                       <X className="w-6 h-6" />
                    </button>
                 </div>

                 <div className="relative z-10 flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-3">
                       <MapPin className="w-5 h-5 text-indigo-600" />
                       <span className="text-sm font-black uppercase tracking-tighter text-slate-900">{template.destination}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Calendar className="w-5 h-5 text-indigo-600" />
                       <span className="text-sm font-black uppercase tracking-tighter text-slate-900">{template.duration_days || template.total_days} Days Plan</span>
                    </div>
                    {template.base_price_per_person && (
                       <div className="flex items-center gap-3">
                          <Banknote className="w-5 h-5 text-emerald-500" />
                          <span className="text-sm font-black uppercase tracking-tighter text-emerald-600">From {formatINR(template.base_price_per_person)}</span>
                       </div>
                    )}
                 </div>

                 {template.tags?.length > 0 && (
                    <div className="relative z-10 flex flex-wrap gap-2 mt-8">
                       {template.tags.map(tag => (
                         <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-slate-100 italic">
                            #{tag}
                         </span>
                       ))}
                    </div>
                 )}
              </header>

              {/* Description */}
              <section className="p-10 border-b border-slate-50">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 underline decoration-slate-200 decoration-2 underline-offset-8">Blueprint Narrative</h3>
                 <p className="text-sm font-bold text-slate-600 leading-relaxed max-w-2xl px-2">
                    {template.description || "No specific narrative provided for this operational sequence."}
                 </p>
              </section>

              {/* Day breakdown */}
              <section className="p-10 space-y-10">
                 <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] underline decoration-indigo-200 decoration-4 underline-offset-8">Master Sequence Breakdown</h3>
                 
                 <div className="space-y-4">
                    {template.days?.map(day => (
                       <div key={day.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                          <button 
                             onClick={() => toggleDay(day.id)}
                             className="w-full flex items-center justify-between p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                          >
                             <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-300 italic">
                                   D{day.day_number}
                                </div>
                                <div className="text-left">
                                   <h4 className="text-base font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">
                                      {day.title || `Day ${day.day_number}`}
                                   </h4>
                                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{day.items?.length || 0} Points of Interest</p>
                                </div>
                             </div>
                             {expandedDays.has(day.id) ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                          </button>

                          {expandedDays.has(day.id) && (
                             <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-300 bg-white">
                                {day.items?.length === 0 ? (
                                   <p className="text-xs font-bold text-slate-300 uppercase tracking-widest text-center py-4 italic leading-none">Free Flow Operations Node</p>
                                ) : (
                                   <div className="space-y-6">
                                      {day.items.map(item => {
                                         const Icon = ACTIVITY_ICONS[item.item_type] || Layout;
                                         return (
                                            <div key={item.id} className="flex gap-6 group">
                                               <div className="flex flex-col items-center">
                                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-slate-100">
                                                     <Icon className="w-5 h-5" />
                                                  </div>
                                                  <div className="flex-1 w-px bg-slate-100 my-2" />
                                               </div>
                                               <div className="flex-1 pb-6">
                                                  <div className="flex items-center gap-3 mb-1">
                                                     <p className="text-xs font-black uppercase tracking-tight text-slate-900 italic leading-none">{item.title}</p>
                                                     {item.duration && <span className="text-[9px] font-bold text-slate-300 uppercase italic">({item.duration})</span>}
                                                  </div>
                                                  {item.location && (
                                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5 mt-1 opacity-60 italic">
                                                        <MapPin className="w-3 h-3" /> {item.location}
                                                     </p>
                                                  )}
                                                  {item.notes && <p className="text-[10px] font-bold text-slate-400 mt-2 italic leading-relaxed max-w-md">{item.notes}</p>}
                                               </div>
                                            </div>
                                         );
                                      })}
                                   </div>
                                )}
                             </div>
                          )}
                       </div>
                    ))}
                 </div>
              </section>

              {/* Action Bar (Sticky Footer) */}
              <div className="fixed bottom-0 right-0 w-full max-w-3xl bg-white/80 backdrop-blur-xl border-t border-slate-100 p-8 flex items-center justify-between gap-4 shadow-2xl z-20">
                 <div className="flex gap-3">
                    <button 
                       onClick={() => onDuplicate(template.id)}
                       className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-slate-100 rounded-2xl transition-all shadow-sm group"
                       title="Duplicate Protocol"
                    >
                       <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                       onClick={() => { if(confirm('Retire this master blueprint?')) onDelete(template.id); }}
                       className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white border border-slate-100 rounded-2xl transition-all shadow-sm group"
                       title="Retire Protocol"
                    >
                       <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                 </div>
                 <div className="flex gap-4">
                    <button 
                       onClick={() => onEdit(template)}
                       className="px-8 py-4 bg-white border-2 border-slate-950 text-slate-950 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                       <Edit3 className="w-4 h-4" /> Modify Matrix
                    </button>
                    <button 
                       onClick={() => navigate(`/quotes/new?template_id=${template.id}`)}
                       className="px-10 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:scale-[1.05] transition-all flex items-center gap-3 animate-gradient-slow group"
                    >
                       Initialize Quote <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
