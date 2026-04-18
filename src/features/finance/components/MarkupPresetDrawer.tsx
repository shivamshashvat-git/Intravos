import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Percent, Banknote, HelpCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { MarkupPreset, MarkupType, AppliesTo } from '../types/markupPreset';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  preset?: MarkupPreset | null;
}

export const MarkupPresetDrawer: React.FC<Props> = ({ isOpen, onClose, onSubmit, preset }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    applies_to: 'all' as AppliesTo,
    calc_type: 'percentage' as MarkupType,
    calc_value: 0,
    is_default: false,
    is_active: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preset) {
      setFormData({
        name: preset.name,
        description: preset.description || '',
        applies_to: preset.applies_to,
        calc_type: preset.calc_type,
        calc_value: Number(preset.calc_value),
        is_default: preset.is_default,
        is_active: preset.is_active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        applies_to: 'all',
        calc_type: 'percentage',
        calc_value: 0,
        is_default: false,
        is_active: true
      });
    }
  }, [preset, isOpen]);

  const preview = useMemo(() => {
    const cost = 10000;
    let selling = cost;
    if (formData.calc_type === 'percentage') {
      selling = cost + (cost * (formData.calc_value / 100));
    } else {
      selling = cost + formData.calc_value;
    }
    return { cost, selling, margin: selling - cost };
  }, [formData.calc_type, formData.calc_value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
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
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto italic">
        <header className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
           <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-950">
                {preset ? 'Modify Logic' : 'Define Pricing Logic'}
              </h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Margin Protocol Initialization</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
              <X className="w-6 h-6" />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="p-10 space-y-12 pb-40">
           {/* Section 1: Identity */}
           <div className="space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Rule Identity*</label>
                 <input 
                   required
                   className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-200"
                   placeholder="e.g. Standard Hotel Markup"
                   value={formData.name}
                   onChange={e => setFormData({ ...formData, name: e.target.value })}
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Scenario Context</label>
                 <textarea 
                   className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all h-24 resize-none"
                   placeholder="Operational scope for this pricing branch..."
                   value={formData.description}
                   onChange={e => setFormData({ ...formData, description: e.target.value })}
                 />
              </div>
           </div>

           {/* Section 2: Rule Def */}
           <div className="space-y-6">
              <div className="flex items-center gap-2 ml-4">
                 <ShieldCheck className="w-4 h-4 text-indigo-600" />
                 <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest leading-none">Core Parameters</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Applies To</label>
                    <select 
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
                      value={formData.applies_to}
                      onChange={e => setFormData({ ...formData, applies_to: e.target.value as AppliesTo })}
                    >
                       <option value="all">All Services</option>
                       <option value="hotel">Hotels</option>
                       <option value="flight">Airlines</option>
                       <option value="activity">Activities</option>
                       <option value="transfer">Transfers</option>
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Markup Type</label>
                    <div className="flex p-1 bg-slate-100 rounded-[1.5rem] border border-slate-200">
                       <button 
                         type="button"
                         onClick={() => setFormData({ ...formData, calc_type: 'percentage' })}
                         className={clsx(
                           "flex-1 py-3 rounded-[1.2rem] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2",
                           formData.calc_type === 'percentage' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                         )}
                       >
                          <Percent className="w-3 h-3" /> %
                       </button>
                       <button 
                         type="button"
                         onClick={() => setFormData({ ...formData, calc_type: 'fixed' })}
                         className={clsx(
                           "flex-1 py-3 rounded-[1.2rem] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2",
                           formData.calc_type === 'fixed' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                         )}
                       >
                          <Banknote className="w-3 h-3" /> Fixed
                       </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-4 pt-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Markup Value*</label>
                 <div className="relative">
                    <input 
                      type="number"
                      required
                      className="w-full px-12 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all pr-20"
                      value={formData.calc_value}
                      onChange={e => setFormData({ ...formData, calc_value: Number(e.target.value) })}
                    />
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">
                       {formData.calc_type === 'percentage' ? '%' : '₹'}
                    </span>
                 </div>
                 <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest ml-4 flex items-center gap-2">
                    <HelpCircle className="w-3 h-3" /> 
                    {formData.calc_type === 'percentage' 
                      ? `${formData.calc_value}% added to gross cost price` 
                      : `Fixed ${formatINR(formData.calc_value)} added per node`}
                 </p>
              </div>
           </div>

           {/* Live Preview */}
           <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden group">
              <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-200/50 group-hover:scale-110 transition-transform" />
              <div className="relative z-10 space-y-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Simulation Hub</p>
                 <div className="flex items-center justify-between">
                    <div className="text-center">
                       <p className="text-[9px] font-black uppercase text-indigo-300 mb-1">Baseline Cost</p>
                       <p className="text-xl font-black text-indigo-900 opacity-60">₹10,000</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-indigo-300 animate-pulse" />
                    <div className="text-center">
                       <p className="text-[9px] font-black uppercase text-indigo-300 mb-1">Projected Selling</p>
                       <p className="text-2xl font-black text-indigo-900">{formatINR(preview.selling)}</p>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-indigo-100 flex justify-center">
                    <span className="px-6 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                       Margin Yield: {formatINR(preview.margin)}
                    </span>
                 </div>
              </div>
           </div>

           {/* Settings */}
           <div className="grid grid-cols-2 gap-8 px-4">
              <label className="flex items-center justify-between cursor-pointer group">
                 <div>
                    <p className="text-[11px] font-black uppercase text-slate-900 leading-none">System Default</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1">Auto-load for {formData.applies_to}</p>
                 </div>
                 <input 
                   type="checkbox"
                   className="w-6 h-6 rounded-lg border-slate-200 text-indigo-600 focus:ring-transparent transition-all cursor-pointer"
                   checked={formData.is_default}
                   onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                 />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                 <div>
                    <p className="text-[11px] font-black uppercase text-slate-900 leading-none">Rules Active</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1">Status in stream</p>
                 </div>
                 <input 
                   type="checkbox"
                   className="w-6 h-6 rounded-lg border-slate-200 text-indigo-600 focus:ring-transparent transition-all cursor-pointer"
                   checked={formData.is_active}
                   onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                 />
              </label>
           </div>

           <button 
             disabled={isSubmitting || !formData.name}
             className="w-full py-6 bg-slate-950 text-white rounded-3xl text-sm font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
           >
              {isSubmitting ? 'Syncing Rules...' : <>{preset ? 'Update Protocol' : 'Deploy Pricing Node'} <ArrowRight className="w-5 h-5" /></>}
           </button>
        </form>
      </div>
    </div>
  );
};
