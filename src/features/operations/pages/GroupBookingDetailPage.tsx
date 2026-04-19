import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Calendar, MapPin, ExternalLink, 
  Plus, Trash2, FileText, Loader2, Download, CheckCircle2,
  Wallet, ShieldCheck, Activity, TrendingUp, UserPlus,
  ArrowRight, Landmark, Receipt
} from 'lucide-react';
import { useAuth } from '@/core/hooks/useAuth';
import { groupBookingsService, GroupBooking, GroupMember } from '../services/groupBookingsService';
import { CustomerSelector } from '@/shared/components/CustomerSelector';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const GroupBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = ['admin', 'agency_admin', 'super_admin'].includes(user?.role || '');
  const [group, setGroup] = useState<GroupBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (id) fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const data = await groupBookingsService.getGroup(id!);
      setGroup(data);
    } catch (e) {
      toast.error('Failed to load group manifest');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!id) return;
    try {
      await groupBookingsService.generateInvoices(id);
      toast.success('Group Invoices Generated Successfully');
      fetchGroup();
    } catch (e) {
      toast.error('Invoicing failed');
    }
  };

  const handleAddMember = async () => {
    if (!selectedCustomer || !id) return;
    setAddingMember(true);
    try {
      await groupBookingsService.addMember(id, {
        member_name: selectedCustomer.name,
        customer_id: selectedCustomer.id,
        pax: 1,
        base_cost: 0 // Will be updated later in edit
      });
      toast.success('Member Node Attached');
      setIsAddMemberOpen(false);
      setSelectedCustomer(null);
      fetchGroup();
    } catch (e) {
      toast.error('Aggregation failed');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) return toast.error('Admin clearance required for node detachment');
    if (!window.confirm('Detach this personnel node from the group operation?')) return;
    
    try {
      await groupBookingsService.removeMember(id!, memberId);
      toast.success('Node Detached Successfully');
      fetchGroup();
    } catch (e) {
      toast.error('Detachment failed');
    }
  };

  if (loading || !group) return <div className="h-screen flex items-center justify-center font-black italic text-slate-300 uppercase tracking-widest">Hydrating Group Manifest...</div>;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Users className="w-64 h-64" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
           <div className="space-y-4">
              <Link to="/bookings" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                 <ArrowLeft className="w-4 h-4" /> Operations Control
              </Link>
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic">
                       {group.group_ref}
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100 italic">
                       {group.status}
                    </span>
                 </div>
                 <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none pt-2">
                    {group.group_name}
                 </h1>
              </div>
              <div className="flex flex-wrap items-center gap-8 pt-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Calendar className="w-4 h-4" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">Expedition Window</p>
                       <p className="text-xs font-bold">{new Date(group.departure_date).toLocaleDateString()} — {new Date(group.return_date).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><MapPin className="w-4 h-4" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">Shared Routing</p>
                       <p className="text-xs font-bold flex items-center gap-2">{group.itinerary?.title || 'Custom Pattern'} <ExternalLink className="w-3 h-3 text-indigo-400" /></p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><Users className="w-4 h-4" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400">Total Capacity</p>
                       <p className="text-xs font-bold">{group.total_pax} Pax Shared</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-end gap-4">
              <button 
                onClick={handleGenerateInvoices}
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl italic tracking-tight shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3 uppercase text-xs"
              >
                <Receipt className="w-4 h-4" /> Generate Group Invoice
              </button>
           </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <FinancialCard label="Total Group Invoiced" val={group.financials?.total_invoiced || 0} icon={TrendingUp} color="border-slate-200" />
         <FinancialCard label="Total Recovery (Paid)" val={group.financials?.total_paid || 0} icon={ShieldCheck} color="border-emerald-200" text="text-emerald-600" />
         <FinancialCard label="Total Outstanding Risk" val={group.financials?.total_outstanding || 0} icon={Landmark} color="border-rose-200" text="text-rose-600" />
      </div>

      {/* Members Section */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Active Group Nodes</h2>
            <button 
              onClick={() => setIsAddMemberOpen(true)}
              className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl flex items-center gap-2 italic shadow-lg"
            >
               <UserPlus className="w-4 h-4" /> Add Member Node
            </button>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm italic">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Member Node</th>
                     <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pax / Config</th>
                     <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Individual Ref</th>
                     <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Value (INR)</th>
                     <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Control</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {group.members?.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400">
                                {m.member_name?.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{m.member_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                   {m.invoice_id ? <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Invoiced</> : <><Activity className="w-3 h-3 text-amber-500" /> Draft</>}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-slate-700">{m.pax} travelers</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.room_sharing || 'Shared Room'}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <button onClick={() => m.booking_id && navigate(`/bookings/${m.booking_id}`)} className="text-[10px] font-black uppercase text-indigo-600 hover:underline">
                             {m.booking_ref || 'PENDING-OPS'}
                          </button>
                       </td>
                       <td className="px-8 py-6 text-right font-black italic text-slate-900">
                          {formatINR(m.per_person_total)}
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-2.5 text-slate-300 hover:text-rose-600 transition-colors"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </td>
                    </tr>
                  ))}
                  {(!group.members || group.members.length === 0) && (
                    <tr>
                       <td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">No member nodes associated.</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Member Drawer */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddMemberOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-500 h-screen flex flex-col italic">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Aggregation</p>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Attach Member Node</h2>
               </div>
            </div>
            <div className="p-8 space-y-8 flex-1">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Lookup Traveler</label>
                  <CustomerSelector onSelect={setSelectedCustomer} placeholder="Search by name/phone..." />
               </div>
               {selectedCustomer && (
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-black uppercase text-slate-400">Selected Payload</p>
                    <p className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{selectedCustomer.name}</p>
                    <p className="text-xs font-bold text-slate-400 italic">{selectedCustomer.phone}</p>
                 </div>
               )}
            </div>
            <div className="p-8 border-t border-slate-100 space-y-4">
               <button 
                 onClick={handleAddMember}
                 disabled={!selectedCustomer || addingMember}
                 className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl uppercase text-xs flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {addingMember ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Commit Detachment</>}
               </button>
               <button onClick={() => setIsAddMemberOpen(false)} className="w-full text-center text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900 transition-colors">Abort</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FinancialCard = ({ label, val, icon: Icon, color, text = "text-slate-900" }: any) => (
  <div className={clsx("bg-white p-8 rounded-[2rem] border-2 shadow-sm flex items-center gap-8 italic transition-transform hover:-translate-y-1", color)}>
     <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-400">
        <Icon className="w-8 h-8" />
     </div>
     <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <h3 className={clsx("text-3xl font-black tracking-tighter", text)}>{formatINR(val)}</h3>
     </div>
  </div>
);
