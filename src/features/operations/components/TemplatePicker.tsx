import React, { useState, useMemo } from 'react';
import { 
  X, Search, LibraryBig, MapPin, Clock, 
  ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { useKnowledgeBank } from '../hooks/useKnowledgeBank';
import { 
  CATEGORY_LABELS, CATEGORY_COLORS, TemplateCategory, ItineraryTemplate 
} from '../types/knowledgeBank';
import { clsx } from 'clsx';
import { formatINR } from '@/utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => Promise<void>;
  hasExistingDays: boolean;
  itineraryTitle?: string;
}

export const TemplatePicker: React.FC<Props> = ({ 
  isOpen, onClose, onSelect, hasExistingDays, itineraryTitle 
}) => {
  const { templates, isLoading, search, setSearch, filters, setFilter } = useKnowledgeBank();
  const [confirmReplace, setConfirmReplace] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = async (templateId: string) => {
    if (hasExistingDays && confirmReplace !== templateId) {
      setConfirmReplace(templateId);
      return;
    }
    
    setIsProcessing(true);
    try {
      await onSelect(templateId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      setConfirmReplace(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 italic">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <header className="p-10 border-b border-slate-50 shrink-0">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <LibraryBig className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-950 leading-none italic">Knowledge Bank</h2>
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select a blueprint to load into your operational sequence</p>
              </div>
              <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-950 rounded-2xl transition-all">
                 <X className="w-6 h-6" />
              </button>
           </div>

           <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                 <input 
                   className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black uppercase italic outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                   placeholder="Search blueprint repository..."
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                 <button 
                   onClick={() => setFilter('category', 'all')}
                   className={clsx(
                     "px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                     filters.category === 'all' ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                   )}
                 >
                    All Sectors
                 </button>
                 {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <button 
                      key={val}
                      onClick={() => setFilter('category', val)}
                      className={clsx(
                        "px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                        filters.category === val ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                      )}
                    >
                       {label}
                    </button>
                 ))}
              </div>
           </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar relative min-h-[400px]">
           {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center font-black uppercase text-slate-200 tracking-[0.2em] italic">
                 Synchronizing Blueprint Library...
              </div>
           ) : templates.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-4">
                 <LibraryBig className="w-16 h-16 text-slate-100" />
                 <p className="text-sm font-black uppercase text-slate-300 tracking-[0.2em]">No Blueprints Found in this sector</p>
                 <button onClick={() => setSearch('')} className="text-[10px] font-black uppercase text-indigo-600 underline">Clear Parameters</button>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {templates.map(template => (
                    <div 
                       key={template.id}
                       onClick={() => !isProcessing && handleSelect(template.id)}
                       className={clsx(
                         "group bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all cursor-pointer relative overflow-hidden flex flex-col border-2",
                         confirmReplace === template.id ? "border-rose-500 bg-rose-50/30" : "border-transparent"
                       )}
                    >
                       {confirmReplace === template.id ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-4 animate-in fade-in zoom-in-95">
                             <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 shadow-inner">
                                <AlertCircle className="w-8 h-8" />
                             </div>
                             <div>
                                <h4 className="text-xl font-black uppercase tracking-tighter text-rose-600 leading-none mb-1">Confirm Replacement?</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto">This blueprint will overwrite all existing tactical nodes in your sequence.</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); setConfirmReplace(null); }} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase italic">Abort</button>
                                <button onClick={(e) => { e.stopPropagation(); handleSelect(template.id); }} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase italic shadow-lg shadow-rose-200">Replace Anyway</button>
                             </div>
                          </div>
                       ) : (
                          <>
                             <div className="flex justify-between items-start mb-6">
                                <span className={clsx(
                                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-inner",
                                  CATEGORY_COLORS[template.category as TemplateCategory]
                                )}>
                                  {CATEGORY_LABELS[template.category as TemplateCategory]}
                                </span>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">{template.total_days || template.duration_days} Days Matrix</span>
                             </div>

                             <div className="flex-1 space-y-3">
                                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-950 leading-tight group-hover:text-indigo-600 transition-colors">
                                   {template.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                   <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                   <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 italic">{template.destination}</p>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 line-clamp-2 uppercase tracking-tight opacity-60">
                                   {template.description || "Experimental sequence blueprint for rapid tactical deployment."}
                                </p>
                             </div>

                             <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="text-[10px] font-black text-slate-300">
                                   {template.base_price_per_person ? formatINR(template.base_price_per_person) : 'PRICE_TBD'}
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                   <ChevronRight className="w-4 h-4" />
                                </div>
                             </div>
                          </>
                       )}
                       
                       {isProcessing && confirmReplace === template.id && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                             <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           )}
        </div>

        {/* Footer */}
        <footer className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3 text-slate-400">
              <RefreshCw className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest italic leading-none">Global Blueprint Stream v1.2</span>
           </div>
           <button onClick={onClose} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors italic">
              Abort Protocol Selection
           </button>
        </footer>
      </div>
    </div>
  );
};
