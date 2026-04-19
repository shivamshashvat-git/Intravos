import React, { useState, useEffect } from 'react';
import { X, CheckSquare, User, Flag, Calendar, Link as LinkIcon, Search, Briefcase, Hash } from 'lucide-react';
import { tasksService } from '@/features/tasks/services/tasksService';
import { usersService } from '@/features/system/services/usersService';
import { leadsService } from '@/features/crm/services/leadsService';
import { bookingsService } from '@/features/operations/services/bookingsService';
import { useAuth } from '@/core/hooks/useAuth';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { TaskType, TaskPriority, TaskStatus } from '../types/task';

interface CreateTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const CreateTaskDrawer: React.FC<CreateTaskDrawerProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const { tenant, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: user?.id as string | null,
    priority: 'medium' as TaskPriority,
    due_date: null as string | null,
    due_time: null as string | null,
    lead_id: null as string | null,
    booking_id: null as string | null,
    customer_id: null as string | null,
    status: 'pending' as TaskStatus
  });

  const [searchLead, setSearchLead] = useState('');
  const [leadResults, setLeadResults] = useState<any[]>([]);
  const [searchBooking, setSearchBooking] = useState('');
  const [bookingResults, setBookingResults] = useState<any[]>([]);

  useEffect(() => {
    if (tenant?.id) {
       usersService.listUsers().then(data => setUsers(data || []));
    }
  }, [tenant?.id]);

  useEffect(() => {
    if (user && !initialData) setFormData(prev => ({ ...prev, assigned_to: user.id }));
    if (initialData) {
       setFormData({
         title: initialData.title || '',
         description: initialData.description || '',
         assigned_to: initialData.assigned_to || '',
         priority: initialData.priority || 'medium',
         due_date: initialData.due_date || '',
         due_time: initialData.due_time || '',
         lead_id: initialData.lead_id || null,
         booking_id: initialData.booking_id || null,
         customer_id: initialData.customer_id || null,
         status: initialData.status || 'pending'
       });
    }
  }, [user, initialData]);

  const handleLeadSearch = async (val: string) => {
    setSearchLead(val);
    if (val.length < 2) { setLeadResults([]); return; }
    try {
      if (!tenant?.id) return;
      const { data } = await leadsService.getLeads(tenant.id, { search: val });
      setLeadResults(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookingSearch = async (val: string) => {
    setSearchBooking(val);
    if (val.length < 2) { setBookingResults([]); return; }
    try {
      if (!tenant?.id) return;
      const data = await bookingsService.getBookings(tenant.id, { search: val });
      setBookingResults(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsSaving(true);
    try {
      if (initialData?.id) {
         await tasksService.updateTask(initialData.id, formData as Partial<TaskType>);
         toast.success('Task node updated');
      } else {
         await tasksService.createTask({ ...formData, tenant_id: tenant.id } as Partial<TaskType>);
         toast.success('Task node deployed');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-bold italic">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}></div>
       <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
             <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black italic uppercase text-slate-900">{initialData?.id ? 'Adjust Operation Node' : 'Initialize Task Hub'}</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execution & Sequence Control</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-5 h-5" /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" /> Goal Configuration
                   </h3>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Title*</label>
                      <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase italic" placeholder="e.g. VFS SUBMISSION" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Detailed Protocol</label>
                      <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium h-24 outline-none focus:bg-white italic" placeholder="Contextual directives..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <User className="w-4 h-4" /> Personnel Assignment
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Assigned Specialist</label>
                         <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase" value={formData.assigned_to || ""} onChange={e => setFormData({...formData, assigned_to: e.target.value})}>
                            <option value="">UNASSIGNED</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Priority Level</label>
                         <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                            <option value="low">Low Impact</option>
                            <option value="medium">Standard Velocity</option>
                            <option value="high">High Momentum</option>
                            <option value="urgent">Critical Block</option>
                         </select>
                      </div>
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Timeline Configuration
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Target Date</label>
                         <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black" value={formData.due_date || ""} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Target Time</label>
                         <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black" value={formData.due_time || ""} onChange={e => setFormData({...formData, due_time: e.target.value})} />
                      </div>
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" /> Record Interconnect
                   </h3>
                   <div className="space-y-4">
                      {/* Lead Link */}
                      {!formData.lead_id && !formData.booking_id ? (
                        <div className="space-y-4">
                           <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase" placeholder="Link Lead..." value={searchLead} onChange={e => handleLeadSearch(e.target.value)} />
                              {leadResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-50">
                                   {leadResults.map(l => (
                                     <button key={l.id} type="button" onClick={() => { setFormData({...formData, lead_id: l.id}); setSearchLead(''); setLeadResults([]); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex justify-between items-center group">
                                        <span className="text-xs font-black text-slate-900 uppercase italic group-hover:text-indigo-600">{l.customer_name}</span>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase">{l.destination}</span>
                                     </button>
                                   ))}
                                </div>
                              )}
                           </div>
                           <div className="relative">
                              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase" placeholder="Link Booking..." value={searchBooking} onChange={e => handleBookingSearch(e.target.value)} />
                              {bookingResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-50">
                                   {bookingResults.map(b => (
                                     <button key={b.id} type="button" onClick={() => { setFormData({...formData, booking_id: b.id}); setSearchBooking(''); setBookingResults([]); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex justify-between items-center group">
                                        <span className="text-xs font-black text-slate-900 uppercase italic group-hover:text-amber-600">{b.booking_number}</span>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase truncate max-w-[120px]">{b.title}</span>
                                     </button>
                                   ))}
                                </div>
                              )}
                           </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between text-white border border-slate-800 italic shadow-xl">
                           <div className="flex items-center gap-3">
                              <Hash className="w-4 h-4 text-indigo-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Record Link Station Active</span>
                           </div>
                           <button type="button" onClick={() => setFormData({...formData, lead_id: null, booking_id: null})} className="p-1 hover:bg-white/10 rounded-lg transition-all"><X className="w-4 h-4 text-white/40" /></button>
                        </div>
                      )}
                   </div>
                </section>
             </div>

             <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-white">
                <button type="button" onClick={onClose} className="text-xs font-black uppercase text-slate-400 italic">Cancel Operation</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-12 py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase italic shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-slate-200"
                >
                   {isSaving ? 'Spinning up Node...' : (initialData?.id ? 'Adjust Parameters' : 'Deploy Deployment')}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};
