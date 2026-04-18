import React, { useState, useMemo } from 'react';
import { 
  Trash2, RotateCcw, Flame, RefreshCw, ChevronDown, 
  ChevronUp, CheckSquare, Square, ShieldAlert,
  UserPlus, Receipt, FileText, Building2, Truck, Percent, File,
  Zap, AlertCircle, Info, Trash
} from 'lucide-react';
import { useTrash } from '../hooks/useTrash';
import { timeAgo } from '@/utils/time';
import { TABLE_LABELS, TrashRecord } from '../types/trash';
import { clsx } from 'clsx';

export const TrashPanel: React.FC = () => {
  const { 
    records, grouped, loading, isEnabled, selectedKeys, 
    toggleSelect, selectAll, restore, purge, 
    restoreBulk, purgeBulk, refresh 
  } = useTrash();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState('all');
  const [purgingKey, setPurgingKey] = useState<string | null>(null);
  const [showBulkPurgeModal, setShowBulkPurgeModal] = useState(false);

  const tableGroups = useMemo(() => {
    return Object.keys(grouped).sort();
  }, [grouped]);

  const filteredGroups = useMemo(() => {
    if (activeFilter === 'all') return tableGroups;
    return tableGroups.filter(g => g.toLowerCase() === activeFilter.toLowerCase());
  }, [tableGroups, activeFilter]);

  const toggleGroup = (group: string) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  if (!isEnabled && !loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8 italic p-12">
        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center text-rose-500 border border-rose-100 shadow-inner">
           <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="max-w-md">
           <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">Registry Shield Active</h2>
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
             Trash Recovery is not enabled on your plan. 
             Upgrade to retain deleted records for 30 days and protect your data stream.
           </p>
        </div>
        <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
           Request Protocol Uplink
        </button>
      </div>
    );
  }

  if (loading && records.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center font-black italic text-slate-300 uppercase tracking-widest">
         Scanning Archive Sectors...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 italic opacity-40">
         <Trash2 className="w-20 h-20 text-slate-200" />
         <div>
            <p className="text-xl font-black uppercase tracking-tighter text-slate-900">Recycle Bin is Empty</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Deleted records will appear here for 30 days before permanent erasure</p>
         </div>
         <button onClick={refresh} className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600">
            <RefreshCw className="w-3 h-3" /> Force Scan
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
       {/* Top Bar */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div>
             <div className="flex items-center gap-4 mb-2">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-950">Recycle Bin</h2>
                <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-xs font-black italic shadow-inner">{records.length} items</span>
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" /> Latent Data Recovery Stream
             </p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={selectAll}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-xl transition-all"
                title="Select All Nodes"
             >
                {selectedKeys.size === records.length ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
             </button>
             
             {selectedKeys.size > 0 && (
               <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                  <button 
                    onClick={() => { if(confirm(`Restore ${selectedKeys.size} records?`)) restoreBulk(); }}
                    className="px-6 py-3.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase italic rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-2 hover:bg-white"
                  >
                     <RotateCcw className="w-4 h-4" /> Restore Selected
                  </button>
                  <button 
                    onClick={() => setShowBulkPurgeModal(true)}
                    className="px-6 py-3.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase italic rounded-2xl border border-rose-100 shadow-sm flex items-center gap-2 hover:bg-white"
                  >
                     <Flame className="w-4 h-4" /> Purge Selected
                  </button>
               </div>
             )}

             <button 
                onClick={refresh}
                className="p-3.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
             >
                <RefreshCw className={clsx("w-5 h-5", loading && "animate-spin")} />
             </button>
          </div>
       </div>

       {/* Filter Chips */}
       <div className="flex items-center gap-2 px-4 overflow-x-auto no-scrollbar pb-2">
          <FilterChip 
            label="All Sectors" 
            active={activeFilter === 'all'} 
            onClick={() => setActiveFilter('all')} 
          />
          {tableGroups.map(g => (
            <FilterChip 
              key={g}
              label={g} 
              active={activeFilter === g} 
              onClick={() => setActiveFilter(g)} 
            />
          ))}
       </div>

       {/* Record List */}
       <div className="space-y-6 px-4">
          {filteredGroups.map(groupName => (
            <div key={groupName} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-100/50 italic">
               <button 
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between p-8 bg-slate-50/50 hover:bg-slate-50 transition-colors"
               >
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                        {getIconForTable(grouped[groupName][0]?.table_name)}
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">{groupName}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{grouped[groupName].length} ARCHIVED NODES</p>
                     </div>
                  </div>
                  {expandedGroups.has(groupName) ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
               </button>

               {!expandedGroups.has(groupName) && (
                  <div className="divide-y divide-slate-50">
                     {grouped[groupName].map(record => (
                       <div 
                         key={`${record.table_name}:${record.item_id}`}
                         className={clsx(
                           "flex items-center gap-6 p-8 hover:bg-slate-50/50 transition-all group border-l-[6px] transition-all",
                           selectedKeys.has(`${record.table_name}:${record.item_id}`) ? "bg-slate-50 border-indigo-600" : "bg-white border-transparent"
                         )}
                       >
                          <button 
                            onClick={() => toggleSelect(record.table_name, record.item_id)}
                            className="p-1 rounded transition-all"
                          >
                             {selectedKeys.has(`${record.table_name}:${record.item_id}`) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-200" />}
                          </button>

                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{record.item_label}</h4>
                                <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black uppercase text-slate-400 rounded-lg">{record.table_name}</span>
                             </div>
                             <p className="text-[10px] font-bold text-slate-300 uppercase italic flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Deleted {timeAgo(record.deleted_at)}
                             </p>
                          </div>

                          <div className="flex items-center gap-3">
                             {purgingKey === `${record.table_name}:${record.item_id}` ? (
                               <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                                  <p className="text-[9px] font-black uppercase text-rose-500 italic mr-2">Confirm Erasure?</p>
                                  <button onClick={() => setPurgingKey(null)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase italic">Cancel</button>
                                  <button onClick={() => purge(record.table_name, record.item_id)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase italic">Purge Forever</button>
                               </div>
                             ) : (
                               <>
                                 <button 
                                   onClick={() => { if(confirm(`Restore ${record.item_label}?`)) restore(record.table_name, record.item_id); }}
                                   className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase italic hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                 >
                                    <RotateCcw className="w-3 h-3" /> Restore
                                 </button>
                                 <button 
                                   onClick={() => setPurgingKey(`${record.table_name}:${record.item_id}`)}
                                   className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl text-[9px] font-black uppercase italic transition-all"
                                 >
                                    <Flame className="w-3 h-3" /> Purge
                                 </button>
                               </>
                             )}
                          </div>
                       </div>
                     ))}
                  </div>
               )}
            </div>
          ))}
       </div>

       {/* Bulk Purge Modal */}
       {showBulkPurgeModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowBulkPurgeModal(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-300 italic">
               <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 border border-rose-100 shadow-inner mb-8 mx-auto">
                  <AlertCircle className="w-10 h-10" />
               </div>
               <div className="text-center space-y-4 mb-10">
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Permanently Delete {selectedKeys.size} Records?</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     This action cannot be undone. These records will be erased from the system parameters permanently. Restore is no longer possible after this protocol.
                  </p>
               </div>
               <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { purgeBulk(); setShowBulkPurgeModal(false); }}
                    className="w-full py-5 bg-rose-600 text-white rounded-3xl text-[11px] font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                     Confirm Permanent Erasure
                  </button>
                  <button 
                    onClick={() => setShowBulkPurgeModal(false)}
                    className="w-full py-5 text-slate-400 text-[11px] font-black uppercase italic tracking-widest hover:text-slate-900 transition-colors"
                  >
                     Abort Mission
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

// Sub-components
const FilterChip = ({ label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap italic",
      active ? "bg-slate-900 text-white shadow-xl" : "bg-slate-50 text-slate-400 hover:bg-slate-100 shadow-inner"
    )}
  >
     {label}
  </button>
);

const getIconForTable = (table: string) => {
  switch (table) {
    case 'leads': return <UserPlus className="w-5 h-5" />;
    case 'invoices': return <Receipt className="w-5 h-5" />;
    case 'quotations': return <FileText className="w-5 h-5" />;
    case 'customers': return <Building2 className="w-5 h-5" />;
    case 'suppliers': return <Truck className="w-5 h-5" />;
    case 'markup_presets': return <Percent className="w-5 h-5" />;
    default: return <File className="w-5 h-5" />;
  }
};
