import React, { useState, useMemo } from 'react';
import { 
  LibraryBig, Plus, Search, MapPin, 
  Clock, Banknote, Layout, Copy, 
  Edit3, Trash2, Filter, ChevronRight,
  BedDouble, Car, Compass, UtensilsCrossed, Plane, Camera,
  RefreshCw, Globe, ChevronLeft
} from 'lucide-react';
import { useKnowledgeBank } from '../hooks/useKnowledgeBank';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';
import { 
  CATEGORY_LABELS, CATEGORY_COLORS, TemplateCategory, ItineraryTemplate 
} from '../types/knowledgeBank';
import { TemplateFormDrawer } from '../components/TemplateFormDrawer';
import { TemplateDetailDrawer } from '../components/TemplateDetailDrawer';
import { toast } from 'sonner';

export const KnowledgeBankPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    templates, isLoading, isEnabled, search, setSearch, 
    filters, setFilter, clearFilters, createTemplate, 
    updateTemplate, deleteTemplate, duplicateTemplate, refresh 
  } = useKnowledgeBank();

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ItineraryTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ItineraryTemplate | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isStaff = user?.role === 'staff' || isAdmin;

  const stats = useMemo(() => {
    const destinations = new Set(templates.map(t => t.destination)).size;
    const avgDuration = templates.length > 0 
      ? templates.reduce((acc, t) => acc + (t.duration_days || t.total_days || 0), 0) / templates.length
      : 0;
    
    return {
      total: templates.length,
      destinations,
      avgDuration: avgDuration.toFixed(1)
    };
  }, [templates]);

  const activeCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [templates]);

  if (!isEnabled && !isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-12 text-center space-y-8 italic">
         <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 border border-rose-100 shadow-inner">
            <LockIcon className="w-10 h-10" />
         </div>
         <div className="max-w-md">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">Blueprint Access Latency</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Knowledge Bank protocols require Tier-2 Itinerary Infrastructure.
              Upgrade your operational node to maintain reusable travel blueprints.
            </p>
         </div>
         <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
            Request Capability Uplink
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-40 px-4">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
             <div className="flex items-center gap-4 mb-3">
                <h1 className="text-6xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">Knowledge Bank</h1>
                <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-xs font-black italic shadow-inner">{stats.total}</span>
             </div>
             <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-6 flex items-center gap-2 leading-none">
                <LibraryBig className="w-4 h-4 text-indigo-600" /> Reusable Master Blueprints for Rapid Sequence Generation
             </p>
          </div>
          {isStaff && (
            <button 
              onClick={() => {
                setEditingTemplate(null);
                setFormDrawerOpen(true);
              }}
              className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase italic tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 animate-gradient-slow"
            >
               <Plus className="w-5 h-5 text-emerald-400" /> Initialize blueprint
            </button>
          )}
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard 
            label="Total Master Blueprints" 
            value={stats.total} 
            sub="Active in repository"
            icon={Layout} 
          />
          <StatCard 
            label="Unique Route Sectors" 
            value={stats.destinations} 
            sub="Regional Coverage"
            icon={Globe} 
            variant="success"
          />
          <StatCard 
            label="Average Mission Length" 
            value={stats.avgDuration} 
            suffix="Days"
            sub="Temporal Mean"
            icon={Clock} 
            variant="warning"
          />
       </div>

       {/* Filters */}
       <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  className="w-full pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-black italic uppercase outline-none focus:ring-4 focus:ring-slate-50 transition-all shadow-sm"
                  placeholder="Query repository by title, destination, or tags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[2.2rem] border border-slate-100">
                <FilterChip 
                  label="All Sectors" 
                  active={filters.category === 'all'} 
                  onClick={() => setFilter('category', 'all')} 
                  count={templates.length}
                />
                {Object.keys(activeCategories).map(cat => (
                   <FilterChip 
                     key={cat}
                     label={CATEGORY_LABELS[cat as TemplateCategory]} 
                     active={filters.category === cat} 
                     onClick={() => setFilter('category', cat)}
                     count={activeCategories[cat]}
                   />
                ))}
             </div>
          </div>
       </div>

       {/* Grid */}
       {isLoading && templates.length === 0 ? (
          <div className="py-40 flex items-center justify-center font-black italic uppercase text-slate-300 tracking-[0.3em] animate-pulse">
             Synchronizing blueprint matrices...
          </div>
       ) : templates.length === 0 ? (
          <div className="py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center italic space-y-6">
             <LibraryBig className="w-20 h-20 text-slate-100" />
             <div>
                <p className="text-xl font-black uppercase tracking-tighter text-slate-900">Repository Cluster Empty</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Initialize your first reusable travel sequence to populate the bank</p>
             </div>
             <button onClick={() => setFormDrawerOpen(true)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase italic tracking-widest">
                Deploy First Blueprint
             </button>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 italic">
             {templates.map(template => (
                <div 
                   key={template.id}
                   onClick={() => {
                      setSelectedTemplate(template);
                      setDetailDrawerOpen(true);
                   }}
                   className="group bg-white rounded-[3.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer relative overflow-hidden flex flex-col"
                >
                   {/* Card Header */}
                   <div className="flex justify-between items-start mb-6">
                      <span className={clsx(
                        "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                        CATEGORY_COLORS[template.category]
                      )}>
                        {CATEGORY_LABELS[template.category]}
                      </span>
                      <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                         <ChevronRight className="w-5 h-5" />
                      </span>
                   </div>

                   {/* Content */}
                   <div className="flex-1 space-y-4">
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-950 leading-tight group-hover:text-indigo-600 transition-colors">
                         {template.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400">
                         <MapPin className="w-4 h-4 text-indigo-500" />
                         <p className="text-xs font-black uppercase tracking-tighter">{template.destination}</p>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed line-clamp-2 min-h-[2.5rem]">
                         {template.description || "Experimental itinerary sequence optimized for specialized travel flow."}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                         {(template.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-50 text-[8px] font-black uppercase text-slate-400 rounded-lg italic border border-slate-100">#{tag}</span>
                         ))}
                         {template.tags?.length > 3 && (
                            <span className="text-[8px] font-black text-slate-300 uppercase italic">+{template.tags.length - 3} More</span>
                         )}
                      </div>
                   </div>

                   {/* Footer */}
                   <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                         <Clock className="w-3.5 h-3.5 text-slate-200" />
                         <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{template.duration_days || template.total_days} Days Matrix</span>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Commercial Baseline</p>
                         <p className="text-sm font-black text-slate-950 tracking-tighter italic">
                            {template.base_price_per_person ? formatINR(template.base_price_per_person) : 'PRICE TBD'}
                         </p>
                      </div>
                   </div>
                   
                   {/* Hover Action Overlay */}
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-300">
                      <ActionButton icon={Copy} color="text-emerald-600 shadow-emerald-100" onClick={() => duplicateTemplate(template.id)} label="Clone" />
                      {isAdmin && (
                        <>
                          <ActionButton icon={Edit3} color="text-indigo-600 shadow-indigo-100" onClick={() => {
                             setEditingTemplate(template);
                             setFormDrawerOpen(true);
                          }} label="Modify" />
                          <ActionButton icon={Trash2} color="text-rose-600 shadow-rose-100" onClick={() => {
                             if(confirm('Purge blueprint matrix?')) deleteTemplate(template.id);
                          }} label="Purge" />
                        </>
                      )}
                   </div>
                </div>
             ))}
          </div>
       )}

       {/* Drawers */}
       <TemplateFormDrawer 
          isOpen={formDrawerOpen}
          onClose={() => {
             setFormDrawerOpen(false);
             setEditingTemplate(null);
          }}
          template={editingTemplate}
          onSubmit={async (data) => {
             if (editingTemplate) await updateTemplate(editingTemplate.id, data);
             else await createTemplate(data);
          }}
       />

       <TemplateDetailDrawer 
          isOpen={detailDrawerOpen}
          onClose={() => {
             setDetailDrawerOpen(false);
             setSelectedTemplate(null);
          }}
          templateId={selectedTemplate?.id || null}
          onEdit={(t) => {
             setDetailDrawerOpen(false);
             setEditingTemplate(t);
             setFormDrawerOpen(true);
          }}
          onDuplicate={(id) => duplicateTemplate(id)}
          onDelete={(id) => deleteTemplate(id)}
       />
    </div>
  );
};

const StatCard = ({ label, value, sub, suffix, icon: Icon, variant = 'default' }: any) => {
   const themes = {
     default: 'bg-white border-slate-100 text-slate-900',
     success: 'bg-slate-950 text-white border-white/5',
     warning: 'bg-indigo-50 border-indigo-100 text-indigo-950'
   } as any;
 
   return (
     <div className={clsx(
       "p-8 rounded-[3rem] border shadow-xl shadow-slate-200/50 flex items-center gap-8 group hover:scale-[1.02] transition-all relative overflow-hidden italic",
       themes[variant]
     )}>
        <div className={clsx(
          "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:rotate-12 relative z-10",
          variant === 'success' ? "bg-white/10" : "bg-slate-50 text-indigo-600 shadow-inner"
        )}>
           <Icon className="w-8 h-8" />
        </div>
        <div className="relative z-10">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{label}</p>
           <h4 className="text-4xl font-black italic tracking-tighter leading-none">
              {value}<span className="text-xl ml-1 opacity-40">{suffix}</span>
           </h4>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-2 opacity-60 italic">{sub}</p>
        </div>
     </div>
   );
 };

 const FilterChip = ({ label, active, onClick, count }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap italic flex items-center gap-2",
      active ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-400 hover:text-slate-600 border border-slate-100"
    )}
  >
     {label}
     {count !== undefined && <span className={clsx("px-1.5 py-0.5 rounded-md text-[8px]", active ? "bg-white/20" : "bg-slate-100")}>{count}</span>}
  </button>
);

const ActionButton = ({ icon: Icon, color, onClick, label }: any) => (
   <button 
     onClick={(e) => { e.stopPropagation(); onClick(); }}
     className={clsx(
       "p-3 bg-white rounded-2xl transition-all shadow-xl hover:scale-110 active:scale-95 border border-slate-50 group/btn relative",
       color
     )}
   >
      <Icon className="w-4 h-4" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
         {label}
      </span>
   </button>
);

const LockIcon = (props: any) => (
   <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
     <path d="M12 8v4" /><path d="M12 16h.01" />
   </svg>
);
