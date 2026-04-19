import React, { useState, useMemo } from 'react';
import { 
  Percent, Plus, Star, Trash2, Edit3, 
  ShieldCheck, AlertTriangle, Layers, Zap,
  Hotel, Plane, Target, Car, Box, RefreshCw
} from 'lucide-react';
import { useMarkupPresets } from '../hooks/useMarkupPresets';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { AppliesTo, MarkupPreset } from '../types/markupPreset';
import { MarkupPresetDrawer } from '../components/MarkupPresetDrawer';

export const MarkupPresetsPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    presets, loading, isEnabled, createPreset, 
    updatePreset, deletePreset, setDefault, refresh 
  } = useMarkupPresets();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<MarkupPreset | null>(null);

  const isAdmin = ['admin', 'agency_admin', 'super_admin'].includes(user?.role || '');

  const stats = useMemo(() => {
    const defaultPreset = presets.find(p => p.is_default);
    const breakdown = presets.reduce((acc: any, p) => {
      acc[p.applies_to] = (acc[p.applies_to] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: presets.length,
      defaultName: defaultPreset?.name || 'None Set',
      breakdown
    };
  }, [presets]);

  if (!isEnabled && !loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-12 text-center space-y-8 italic">
         <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 border border-rose-100 shadow-inner">
            <LockIcon className="w-10 h-10" />
         </div>
         <div className="max-w-md">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">Pricing Rules Locked</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Automated markup presets are a Tier-2 capability. 
              Upgrade your operational node to stabilize pricing governance.
            </p>
         </div>
         <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200">
            Request Capability Uplink
         </button>
      </div>
    );
  }

  if (loading && presets.length === 0) {
    return (
      <div className="h-[70vh] flex items-center justify-center italic text-slate-300 font-black uppercase tracking-[0.3em]">
        Synchronizing Pricing Matrices...
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-40 px-4">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
             <div className="flex items-center gap-4 mb-3">
                <h1 className="text-6xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">Markup Presets</h1>
                <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-xs font-black italic shadow-inner">{presets.length}</span>
             </div>
             <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Define margin rules applied to quote and invoice line items
             </p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                setEditingPreset(null);
                setDrawerOpen(true);
              }}
              className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase italic tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
               <Plus className="w-5 h-5 text-emerald-400" /> Register Pricing Node
            </button>
          )}
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <DetailCard 
            label="Total Pricing Rules" 
            value={stats.total} 
            sub="Active in stream"
            icon={Layers} 
          />
          <DetailCard 
            label="Default Protocol" 
            value={stats.defaultName} 
            sub="Auto-apply priority"
            icon={Star} 
            variant="success"
          />
          <DetailCard 
            label="Domain Distribution" 
            value={Object.keys(stats.breakdown).length + ' Sectors'} 
            sub="Targeting hotel/flight/car"
            icon={Zap} 
            variant="warning"
          />
       </div>

       {/* Presets Grid */}
       {presets.length === 0 ? (
         <div className="py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center italic space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
               <Percent className="w-10 h-10" />
            </div>
            <div>
               <p className="text-xl font-black uppercase tracking-tighter text-slate-900">No Presets Defined</p>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize your first pricing matrix to enable automation</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setDrawerOpen(true)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase"
              >
                Create First Preset
              </button>
            )}
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 italic">
            {presets.map(preset => (
              <div 
                key={preset.id} 
                className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all group relative overflow-hidden"
              >
                 {/* ID / Status line */}
                 <div className="flex justify-between items-start mb-6">
                    <AppliesToBadge type={preset.applies_to} />
                    <div className="flex gap-2">
                       {preset.is_default && (
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Default
                         </span>
                       )}
                       {!preset.is_active && (
                         <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-slate-100">
                            Inactive
                         </span>
                       )}
                    </div>
                 </div>

                 {/* Main Content */}
                 <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors">{preset.name}</h3>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-black text-slate-950 tracking-tighter">
                          {preset.calc_type === 'percentage' ? preset.calc_value : formatINR(preset.calc_value)}
                       </span>
                       <span className="text-xl font-black text-slate-300 italic lowercase">
                          {preset.calc_type === 'percentage' ? '% margin' : 'flat fee'}
                       </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight line-clamp-2 min-h-[2.4rem]">
                       {preset.description || 'No operational description provided for this protocol.'}
                    </p>
                 </div>

                 {/* Actions */}
                 <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                       {isAdmin ? (
                         <>
                            <ActionButton 
                              icon={Edit3} 
                              onClick={() => {
                                setEditingPreset(preset);
                                setDrawerOpen(true);
                              }} 
                              label="Edit"
                            />
                            <ActionButton 
                              icon={Star} 
                              onClick={() => setDefault(preset.id)} 
                              label="Default" 
                              active={preset.is_default}
                              color="text-amber-500 hover:bg-amber-50"
                            />
                            <ActionButton 
                              icon={Trash2} 
                              onClick={() => {
                                if (preset.is_default) {
                                  toast.error('Cannot delete default preset');
                                  return;
                                }
                                if (window.confirm('Retire this pricing node?')) deletePreset(preset.id);
                              }} 
                              label="Retire" 
                              color="text-rose-500 hover:bg-rose-50"
                            />
                         </>
                       ) : (
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Governance Locked</span>
                       )}
                    </div>
                    <RefreshCw className="w-4 h-4 text-slate-100 group-hover:text-indigo-100 group-hover:rotate-180 transition-all duration-700" />
                 </div>
              </div>
            ))}
         </div>
       )}

       <MarkupPresetDrawer 
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          preset={editingPreset}
          onSubmit={async (data) => {
            if (editingPreset) await updatePreset(editingPreset.id, data);
            else await createPreset(data);
          }}
       />
    </div>
  );
};

const DetailCard = ({ label, value, sub, icon: Icon, variant = 'default' }: any) => {
  const themes = {
    default: 'bg-white border-slate-100 text-slate-900',
    success: 'bg-slate-950 text-white border-white/5',
    warning: 'bg-indigo-50 border-indigo-100 text-indigo-950'
  } as any;

  return (
    <div className={clsx(
      "p-8 rounded-[3rem] border shadow-xl shadow-slate-200/50 flex items-center gap-8 group hover:scale-[1.02] transition-all",
      themes[variant]
    )}>
       <div className={clsx(
         "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:rotate-12",
         variant === 'success' ? "bg-white/10" : "bg-slate-50 text-indigo-600 shadow-inner"
       )}>
          <Icon className="w-8 h-8" />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{label}</p>
          <h4 className="text-2xl font-black italic tracking-tighter leading-none">{value}</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-60">{sub}</p>
       </div>
    </div>
  );
};

const AppliesToBadge = ({ type }: { type: AppliesTo }) => {
  const configs = {
    all: { icon: Box, color: 'bg-slate-100 text-slate-600', label: 'All Services' },
    hotel: { icon: Hotel, color: 'bg-blue-100 text-blue-600', label: 'Hotels' },
    flight: { icon: Plane, color: 'bg-purple-100 text-purple-600', label: 'Flights' },
    activity: { icon: Target, color: 'bg-emerald-100 text-emerald-600', label: 'Activities' },
    transfer: { icon: Car, color: 'bg-orange-100 text-orange-600', label: 'Transfers' }
  } as any;

  const conf = configs[type] || configs.all;
  const Icon = conf.icon;

  return (
    <div className={clsx("flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-black/5", conf.color)}>
       <Icon className="w-3.5 h-3.5" />
       {conf.label}
    </div>
  );
};

const ActionButton = ({ icon: Icon, onClick, label, active = false, color = 'text-slate-400 hover:bg-slate-50' }: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={clsx(
      "p-3 rounded-2xl transition-all relative group/btn",
      active ? "bg-amber-50 text-amber-500 shadow-sm border border-amber-100" : color
    )}
  >
     <Icon className={clsx("w-5 h-5", active && "fill-current")} />
     <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase opacity-0 group-hover/btn:opacity-100 transition-opacity rounded">
        {label}
     </span>
  </button>
);

const LockIcon = (props: any) => (
  <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
)

import { toast } from 'sonner';
