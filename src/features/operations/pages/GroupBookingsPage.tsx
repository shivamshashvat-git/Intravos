import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, ShieldCheck, Clock, 
  MapPin, Calendar, Users, AlertCircle, CheckCircle2,
  Lock, Globe, FileText, ChevronRight, MoreVertical,
  XCircle, ArrowRight, Wallet, Hash, Contact, Loader2,
  Briefcase, ArrowLeft, Check, User
} from 'lucide-react';
import { groupBookingsService, GroupBooking } from '../services/groupBookingsService';
import { CustomerSelector } from '@/shared/components/CustomerSelector';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const GroupBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', month: '' });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const data = await groupBookingsService.getGroups();
      setGroups(data);
    } catch (e) {
      toast.error('Failed to load group bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = groups.filter(g => {
    const matchesSearch = g.group_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      g.group_ref.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesMonth = !filters.month || g.departure_date.split('-')[1] === filters.month;
    
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Group Command</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> {groups.length} Collective Operations Active
          </p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all uppercase italic text-xs"
        >
          <Plus className="w-4 h-4" /> Initialize Group
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm tracking-tight"
            placeholder="Search Group Name, Ref, Itinerary..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select 
          className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs uppercase italic"
          value={filters.month}
          onChange={e => setFilters({ ...filters, month: e.target.value })}
        >
           <option value="">All Deployment Windows</option>
           {Array.from({ length: 12 }).map((_, i) => {
             const date = new Date(2026, i, 1);
             return <option key={i} value={(i+1).toString().padStart(2, '0')}>{date.toLocaleString('en-US', { month: 'long' })}</option>
           })}
        </select>
      </div>

      {/* Grid view for groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-32 text-center italic text-slate-400 uppercase tracking-widest flex items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin" /> Gathering Group Data...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-40 text-center rounded-[3rem] border-4 border-dashed border-slate-50 italic">
            <Users className="w-20 h-20 text-slate-100 mx-auto mb-8" />
            <h3 className="text-3xl font-black text-slate-900 italic uppercase">Collective Null</h3>
            <p className="text-sm font-bold text-slate-400 mt-2 px-40">No cluster bookings detected. Initialize a group operation to aggregate member logistics.</p>
          </div>
        ) : (
          filtered.map(g => (
            <div 
              key={g.id} 
              onClick={() => navigate(`/bookings/groups/${g.id}`)}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:border-indigo-600 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 italic">
                    {g.group_ref}
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-indigo-600 transition-colors">
                    {g.group_name}
                  </h3>
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(g.departure_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Users className="w-4 h-4" />
                      {g.member_count} Members · {g.total_pax} Pax
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Combined Value</p>
                  <p className="text-2xl font-black italic text-slate-900 tracking-tighter">
                    {formatINR(g.financials?.total_invoiced || 0)}
                  </p>
                  <span className={clsx(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase border mt-2 inline-block",
                    g.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                  )}>
                    {g.status}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-600 italic">{g.itinerary?.title || 'Custom Route'}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" />
              </div>
              
              {/* Background accent */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))
        )}
      </div>

      <CreateGroupDrawer isOpen={isDrawerOpen} onClose={() => { setIsDrawerOpen(false); fetchGroups(); }} />
    </div>
  );
};

// Subcomponent: Multi-step Drawer
const CreateGroupDrawer: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    group_name: '',
    itinerary_id: '',
    departure_date: '',
    return_date: '',
    members: [] as any[]
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await groupBookingsService.createGroup(formData);
      toast.success('Group Operation Initialized');
      onClose();
    } catch (e) {
      toast.error('Initialization failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-500 h-screen flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-1">Step {step}/3</p>
                 <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Initialize Group Protocol</h2>
               </div>
            </div>
            <div className="flex gap-2">
               {[1,2,3].map(s => (
                 <div key={s} className={clsx("w-8 h-1.5 rounded-full transition-all", s === step ? "bg-indigo-600 w-12" : (s < step ? "bg-emerald-500" : "bg-slate-100"))} />
               ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 space-y-12">
             {step === 1 && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Group Operation Name</label>
                   <input 
                     autoFocus
                     className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-xl font-black italic placeholder:text-slate-200"
                     placeholder="e.g., Summit Expedition 2026"
                     value={formData.group_name}
                     onChange={e => setFormData({ ...formData, group_name: e.target.value })}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Departure Vector</label>
                      <input 
                        type="date"
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold"
                        value={formData.departure_date}
                        onChange={e => setFormData({ ...formData, departure_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Terminal Date</label>
                      <input 
                        type="date"
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold"
                        value={formData.return_date}
                        onChange={e => setFormData({ ...formData, return_date: e.target.value })}
                      />
                    </div>
                 </div>
               </div>
             )}

             {step === 2 && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl italic relative overflow-hidden">
                    <Users className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                    <h3 className="text-lg font-black uppercase tracking-tight mb-2">Member Aggregation</h3>
                    <p className="text-xs font-bold opacity-70">Search and link customer nodes to this group operation. Set individual pax counts per node.</p>
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Lookup Traveler Node</label>
                    <CustomerSelector 
                      onSelect={(c) => {
                        if (c && !formData.members.find(m => m.id === c.id)) {
                          setFormData({ ...formData, members: [...formData.members, { id: c.id, name: c.name, pax: 1 }] });
                        }
                      }}
                      placeholder="Search and add members..."
                    />
                 </div>

                 <div className="space-y-4">
                    {formData.members.map((m, idx) => (
                      <div key={m.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 italic">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-slate-400 text-xs">{idx + 1}</div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{m.name}</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                               <label className="text-[8px] font-black uppercase text-slate-400">Pax</label>
                               <input 
                                 type="number" 
                                 className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-xs font-black"
                                 value={m.pax}
                                 onChange={e => {
                                   const newMembers = [...formData.members];
                                   newMembers[idx].pax = Number(e.target.value);
                                   setFormData({ ...formData, members: newMembers });
                                 }}
                               />
                            </div>
                            <button 
                              onClick={() => setFormData({ ...formData, members: formData.members.filter(mem => mem.id !== m.id) })}
                              className="text-rose-500 hover:text-rose-700 transition-colors"
                            >
                               <XCircle className="w-5 h-5" />
                            </button>
                         </div>
                      </div>
                    ))}
                    {formData.members.length === 0 && (
                      <div className="p-12 text-center border-4 border-dashed border-slate-50 rounded-[2rem] italic">
                         <Search className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No member nodes associated. Link travelers above.</p>
                      </div>
                    )}
                 </div>
               </div>
             )}

             {step === 3 && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white border-2 border-slate-900 p-8 rounded-[2.5rem] italic">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Review Manifest</p>
                     <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase text-indigo-600">Operation</p>
                          <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{formData.group_name || 'N/A'}</h4>
                        </div>
                        <div className="flex justify-between border-t border-slate-50 pt-6">
                           <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">Duration</p>
                              <p className="text-sm font-bold">{formData.departure_date} to {formData.return_date}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-slate-400">Logistics Payload</p>
                              <p className="text-sm font-bold">{formData.members.length} Nodes · {formData.members.reduce((a,b)=>a+b.pax, 0)} Pax</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
             <button 
               onClick={onClose}
               className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
             >
               Abort Initialization
             </button>
             <div className="flex gap-4">
                {step > 1 && (
                  <button onClick={prevStep} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl italic flex items-center gap-2 uppercase text-xs">
                     Back
                  </button>
                )}
                {step < 3 ? (
                  <button onClick={nextStep} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl italic flex items-center gap-2 shadow-xl shadow-indigo-100 uppercase text-xs">
                     Next Phase <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl italic flex items-center gap-2 shadow-xl shadow-slate-200 uppercase text-xs disabled:opacity-50">
                     {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Commit Group</>}
                  </button>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};
