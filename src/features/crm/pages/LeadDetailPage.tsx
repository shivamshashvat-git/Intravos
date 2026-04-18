import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Phone, Mail, MoreVertical, Edit3, UserPlus, Trash2, StickyNote, 
  PhoneCall, Calendar, MessageSquare, ArrowRight, Clock, Pin, CheckCircle2, X, 
  ExternalLink, ChevronDown, Info, DollarSign, PieChart, History, AlertCircle, 
  Plus, ShieldCheck, FileText, Briefcase, User, MapPin, Package, AlertTriangle, 
  TrendingUp, Globe, Landmark, Wifi, Utensils, Plane, Hotel, Check, ChevronRight, Stamp, Shield, CheckSquare, Rocket, Receipt
} from 'lucide-react';
import { supabase } from '@/core/lib/supabase';
import { useAuth } from '@/core/hooks/useAuth';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useLeadDetail } from '@/features/crm/hooks/useLeadDetail';
import { leadsService } from '@/features/crm/services/leadsService';
import { quotationsService } from '@/features/finance/services/quotationsService';
import { invoicesService } from '@/features/finance/services/invoicesService';
import { bookingsService } from '@/features/operations/services/bookingsService';
import { Quotation } from '@/features/finance/types/quotation';
import { Invoice } from '@/features/finance/types/invoice';
import { Booking } from '@/features/operations/types/booking';
import { CreateBookingDrawer } from '@/features/operations/components/CreateBookingDrawer';
import { useVisa } from '@/features/operations/hooks/useVisa';
import { CreateVisaDrawer } from '@/features/operations/components/CreateVisaDrawer';
import { EditLeadDrawer } from '../components/EditLeadDrawer';
import { CreateCustomerDrawer } from '../components/CreateCustomerDrawer';

import { formatINR } from '@/utils/currency';
import { timeAgo, formatAbsoluteDate } from '@/utils/time';
import { LeadStatus, CommType, CommDirection } from '@/features/crm/types/lead';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const { lead, timeline, followups, isLoading, error, refreshLead, setLead } = useLeadDetail(id!);

  // UI States
  const [activeForm, setActiveForm] = useState<'note' | 'call' | 'followup' | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isConvertDrawerOpen, setIsConvertDrawerOpen] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [isVisaDrawerOpen, setIsVisaDrawerOpen] = useState(false);
  const { visas, alerts: vAlerts, updateStatus: vUpdateStatus, updatePassportHolder: vUpdateHolder, updateDoc: vUpdateDoc, refreshVisas } = useVisa(id!);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const fetchRelatedData = useCallback(async () => {
    if (!id || !tenant?.id) return;
    try {
      const [qRes, iRes, bRes] = await Promise.all([
        quotationsService.getQuotations(tenant.id, { lead_id: id }),
        invoicesService.getInvoices(tenant.id, { lead_id: id } as any),
        supabase.from('bookings').select('*').eq('lead_id', id).eq('tenant_id', tenant.id).is('deleted_at', null).maybeSingle()
      ]);
      setQuotations(qRes);
      setInvoices(iRes);
      setBooking(bRes.data);
    } catch (e) {
      console.error(e);
    }
  }, [id, tenant?.id]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  // Form States
  const [noteContent, setNoteContent] = useState('');
  const [commData, setCommData] = useState({
    type: 'call' as CommType,
    direction: 'outbound' as CommDirection,
    date: new Date().toISOString().slice(0, 16),
    summary: '',
    duration: 15
  });
  const [fuData, setFuData] = useState({
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    note: ''
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    const oldStatus = lead.status;
    setLead({ ...lead, status: newStatus });
    try {
      await leadsService.updateLead(lead.id, { status: newStatus });
      refreshLead(); // Refresh to catch status change in timeline
      showToast(`Status updated to ${newStatus}`);
    } catch (e) {
      setLead({ ...lead, status: oldStatus });
      showToast('Status update failed', 'error');
    }
  };

  const handleDeleteLead = async () => {
    if (!lead || !window.confirm('Delete this lead? This cannot be undone.')) return;
    try {
      await leadsService.deleteLead(lead.id);
      navigate('/leads');
    } catch (e) {
      showToast('Delete failed', 'error');
    }
  };

  const handleConvert = async () => {
    if (!lead) return;
    
    // Check if customer with same phone exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id, name')
      .eq('phone', lead.customer_phone)
      .eq('tenant_id', tenant?.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      if (window.confirm(`A customer with this phone number already exists: ${existing.name}. Link this lead to the existing profile?`)) {
        await leadsService.updateLead(lead.id, { status: 'converted', customer_id: existing.id });
        showToast('Lead linked to existing customer');
        navigate(`/customers/${existing.id}`);
        return;
      }
    }
    
    setIsConvertDrawerOpen(true);
  };

  const handleConversionSuccess = async (newCustomer: any) => {
    if (!lead) return;
    try {
      await leadsService.updateLead(lead.id, { 
        status: 'converted', 
        customer_id: newCustomer.id 
      });
      showToast('Lead converted. Customer profile created.');
      navigate(`/customers/${newCustomer.id}`);
    } catch (e) {
      showToast('Lead status update failed', 'error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user || !lead) return;
    try {
      await leadsService.createNote({
        tenant_id: tenant.id,
        lead_id: lead.id,
        user_id: user.id,
        content: noteContent
      });
      setNoteContent('');
      setActiveForm(null);
      refreshLead();
      showToast('Note added');
    } catch (e) {
      showToast('Failed to add note', 'error');
    }
  };

  const handleLogComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user || !lead) return;
    try {
      await leadsService.createCommunication({
        tenant_id: tenant.id,
        lead_id: lead.id,
        user_id: user.id,
        comm_type: commData.type,
        direction: commData.direction,
        summary: commData.summary,
        duration_mins: commData.duration,
        comm_date: new Date(commData.date).toISOString()
      });
      setCommData({ ...commData, summary: '' });
      setActiveForm(null);
      refreshLead();
      showToast('Activity logged');
    } catch (e) {
      showToast('Failed to log activity', 'error');
    }
  };

  const handleSetFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !user || !lead) return;
    try {
      await leadsService.createFollowup({
        tenant_id: tenant.id,
        lead_id: lead.id,
        user_id: user.id,
        due_date: new Date(fuData.date).toISOString(),
        note: fuData.note
      });
      setFuData({ ...fuData, note: '' });
      setActiveForm(null);
      refreshLead();
      showToast('Follow-up set');
    } catch (e) {
      showToast('Failed to set follow-up', 'error');
    }
  };

  const handleWhatsApp = async () => {
    if (!lead) return;
    const cleanPhone = lead.customer_phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(lead.customer_name)}`;
    window.open(url, '_blank');
    
    // Log silently
    if (tenant && user) {
       await leadsService.createCommunication({
         tenant_id: tenant.id,
         lead_id: lead.id,
         user_id: user.id,
         comm_type: 'whatsapp',
         direction: 'outbound',
         comm_date: new Date().toISOString(),
         summary: 'WhatsApp conversation opened'
       });
       refreshLead();
    }
  };

  const togglePin = async (noteId: string, currentPin: boolean) => {
    try {
      await leadsService.pinNote(noteId, !currentPin);
      refreshLead();
    } catch (e) {
      showToast('Pin failed', 'error');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await leadsService.deleteNote(noteId);
      refreshLead();
    } catch (e) {
      showToast('Delete failed', 'error');
    }
  };

  const markFUDone = async (fuId: string) => {
    try {
      await leadsService.markFollowupDone(fuId);
      refreshLead();
      showToast('Follow-up completed');
    } catch (e) {
      showToast('Action failed', 'error');
    }
  };

  const deleteFU = async (fuId: string) => {
    if (!window.confirm('Delete this follow-up?')) return;
    try {
      await leadsService.deleteFollowup(fuId);
      refreshLead();
    } catch (e) {
      showToast('Delete failed', 'error');
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center">Loading Lead...</div>;
  if (error || !lead) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Lead Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-xs">{error || "The lead you are looking for doesn't exist or has been removed."}</p>
        <Link to="/leads" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Leads
        </Link>
      </div>
    );
  }

  const outstandingAmt = lead.selling_price - lead.amount_collected;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20 relative">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <Link to="/leads" className="hover:text-indigo-600">Leads</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">{lead.customer_name}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">{lead.customer_name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <a href={`tel:${lead.customer_phone}`} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                <Phone className="w-4 h-4" /> {lead.customer_phone}
              </a>
              {lead.customer_email && (
                <a href={`mailto:${lead.customer_email}`} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 pl-4">
                  <Mail className="w-4 h-4" /> {lead.customer_email}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-400">{lead.source}</span>
             <PriorityBadge priority={lead.priority} onChange={(p: any) => leadsService.updateLead(lead.id, { priority: p }).then(refreshLead)} />
             <div className="h-4 w-px bg-slate-200 mx-1"></div>
             <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Assigned to: <span className="text-indigo-600">Staff Member</span>
             </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <StatusBadge status={lead.status} onChange={handleStatusChange} />
          <button onClick={() => setIsEditDrawerOpen(true)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">
            <Edit3 className="w-5 h-5" />
          </button>
            <div className="flex gap-2">
              <Link to={`/quotations/new?lead_id=${lead.id}`} className="px-6 py-2.5 bg-slate-100 text-slate-900 border border-slate-200 font-black rounded-xl shadow-sm hover:bg-white active:scale-95 transition-all uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 italic">
                <FileText className="w-4 h-4 text-indigo-500" /> Draft Proposal
              </Link>
              <button 
                onClick={() => setIsBookingDrawerOpen(true)}
                className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl shadow-lg shadow-slate-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.1em] text-[10px] flex items-center gap-2 italic"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Create Booking
              </button>
              <button onClick={handleConvert} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-100 hover:brightness-110 active:scale-95 transition-all uppercase tracking-tight text-[10px]">
                Convert Customer
              </button>
            </div>

          <button onClick={handleDeleteLead} className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-500 hover:bg-red-100 transition-colors shadow-sm">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Timeline (Left) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[800px]">
            {/* Timeline Action Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/30 shrink-0">
              <button 
                onClick={() => setActiveForm(activeForm === 'note' ? null : 'note')}
                className={cn("px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", activeForm === 'note' ? "bg-yellow-100 text-yellow-700 border border-yellow-200" : "hover:bg-slate-100 text-slate-600")}
              >
                <StickyNote className="w-4 h-4" /> Note
              </button>
              <button 
                 onClick={() => setActiveForm(activeForm === 'call' ? null : 'call')}
                 className={cn("px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", activeForm === 'call' ? "bg-blue-100 text-blue-700 border border-blue-200" : "hover:bg-slate-100 text-slate-600")}
              >
                <PhoneCall className="w-4 h-4" /> Log Call
              </button>
              <button 
                 onClick={() => setActiveForm(activeForm === 'followup' ? null : 'followup')}
                 className={cn("px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", activeForm === 'followup' ? "bg-green-100 text-green-700 border border-green-200" : "hover:bg-slate-100 text-slate-600")}
              >
                <Calendar className="w-4 h-4" /> Follow-up
              </button>
              <div className="flex-1"></div>
              <button onClick={handleWhatsApp} className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100">
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </button>
            </div>

            {/* Inline Forms Container */}
            {activeForm && (
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-300">
                {activeForm === 'note' && (
                  <form onSubmit={handleAddNote} className="space-y-4">
                    <textarea 
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white h-32 outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                      placeholder="Write your note here..."
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                       <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                       <button type="submit" disabled={noteContent.length < 5} className="px-6 py-2 bg-yellow-400 text-yellow-950 font-bold text-sm rounded-lg hover:bg-yellow-500 disabled:opacity-50">Add Note</button>
                    </div>
                  </form>
                )}
                {activeForm === 'call' && (
                   <form onSubmit={handleLogComm} className="space-y-4">
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <select className="px-3 py-2 border rounded-lg bg-white text-sm font-bold" value={commData.type} onChange={e => setCommData({...commData, type: e.target.value as any})}>
                           <option value="call">Call</option>
                           <option value="whatsapp">WhatsApp</option>
                           <option value="email">Email</option>
                           <option value="sms">SMS</option>
                           <option value="in_person">In Person</option>
                        </select>
                        <div className="flex border rounded-lg overflow-hidden h-9">
                           <button type="button" onClick={() => setCommData({...commData, direction: 'outbound'})} className={cn("flex-1 text-[10px] font-bold uppercase", commData.direction === 'outbound' ? "bg-indigo-600 text-white" : "bg-white text-slate-400")}>Outbound</button>
                           <button type="button" onClick={() => setCommData({...commData, direction: 'inbound'})} className={cn("flex-1 text-[10px] font-bold uppercase", commData.direction === 'inbound' ? "bg-indigo-600 text-white" : "bg-white text-slate-400")}>Inbound</button>
                        </div>
                        <input type="datetime-local" className="px-3 py-2 border rounded-lg bg-white text-sm" value={commData.date} onChange={e => setCommData({...commData, date: e.target.value})} />
                        <input type="number" placeholder="Duration (min)" className="px-3 py-2 border rounded-lg bg-white text-sm" value={commData.duration} onChange={e => setCommData({...commData, duration: parseInt(e.target.value) || 0})} />
                     </div>
                     <textarea className="w-full px-4 py-3 border rounded-xl bg-white h-24 text-sm" placeholder="Summary of the conversation..." value={commData.summary} onChange={e => setCommData({...commData, summary: e.target.value})} />
                     <div className="flex justify-end gap-2">
                       <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                       <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700">Log Communication</button>
                    </div>
                   </form>
                )}
                {activeForm === 'followup' && (
                  <form onSubmit={handleSetFollowup} className="space-y-4">
                     <div className="max-w-xs">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Due Date & Time</label>
                        <input type="datetime-local" className="w-full px-3 py-2 border rounded-lg bg-white text-sm" value={fuData.date} onChange={e => setFuData({...fuData, date: e.target.value})} />
                     </div>
                     <textarea className="w-full px-4 py-3 border rounded-xl bg-white h-24 text-sm" placeholder="Remind yourself to..." value={fuData.note} onChange={e => setFuData({...fuData, note: e.target.value})} />
                     <div className="flex justify-end gap-2">
                       <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
                       <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700">Set Follow-up</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Timeline Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {timeline.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 italic">
                    <History className="w-12 h-12 mb-4" />
                    <p>No activity recorded yet.</p>
                 </div>
               ) : (
                 timeline.map((entry, idx) => (
                   <div key={entry.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                         <div className={cn(
                           "p-2.5 rounded-full border shadow-sm shrink-0 relative z-10",
                           entry.type === 'note' && "bg-yellow-50 border-yellow-100 text-yellow-600",
                           entry.type === 'communication' && "bg-blue-50 border-blue-100 text-blue-600",
                           entry.type === 'followup' && "bg-green-50 border-green-100 text-green-600",
                           entry.type === 'status_change' && "bg-slate-50 border-slate-100 text-slate-400"
                         )}>
                            {entry.type === 'note' && <StickyNote className="w-4 h-4" />}
                            {entry.type === 'communication' && <PhoneCall className="w-4 h-4" />}
                            {entry.type === 'followup' && <Calendar className="w-4 h-4" />}
                            {entry.type === 'status_change' && <ArrowRight className="w-4 h-4" />}
                         </div>
                         {idx < timeline.length - 1 && <div className="w-px h-full bg-slate-100 mt-2"></div>}
                      </div>

                      <div className="flex-1 min-w-0 pb-2">
                         <div className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                               {entry.type === 'communication' ? `${(entry.metadata as any).comm_type} (${(entry.metadata as any).direction})` : entry.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap" title={formatAbsoluteDate(entry.date)}>
                               {timeAgo(entry.date)}
                            </span>
                         </div>
                         
                         <div className={cn(
                           "p-4 rounded-xl border border-slate-100 shadow-sm relative transition-all group-hover:border-slate-200",
                           entry.is_pinned ? "bg-amber-50/30 border-amber-100" : "bg-white"
                         )}>
                            {entry.is_pinned && <Pin className="absolute -top-2 -right-2 w-4 h-4 text-amber-500 fill-amber-500" />}
                            
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>

                            {entry.type === 'followup' && (
                               <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                                  {entry.metadata.is_done ? (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                       <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                    </div>
                                  ) : (
                                    <>
                                       <div className="flex items-center gap-1.5">
                                          {new Date(entry.metadata.due_date) < new Date() && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Overdue</span>}
                                          <span className="text-[10px] font-bold text-slate-500">{formatAbsoluteDate(entry.metadata.due_date)}</span>
                                       </div>
                                       <button onClick={() => markFUDone(entry.id)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800">Mark Done</button>
                                    </>
                                  )}
                               </div>
                            )}

                            {/* Relative Tooltip for timestamp - just showing how it could look */}
                            <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3 right-3">
                               {entry.type === 'note' && (
                                  <>
                                     <button onClick={() => togglePin(entry.id, entry.is_pinned || false)} className={cn("p-1.5 rounded bg-white border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm", entry.is_pinned ? "text-amber-500" : "text-slate-400")}><Pin className="w-3 h-3" /></button>
                                     <button onClick={() => deleteNote(entry.id)} className="p-1.5 rounded bg-white border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors shadow-sm"><Trash2 className="w-3 h-3" /></button>
                                  </>
                               )}
                               {entry.type === 'followup' && !entry.metadata.is_done && (
                                  <button onClick={() => deleteFU(entry.id)} className="p-1.5 rounded bg-white border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors shadow-sm"><Trash2 className="w-3 h-3" /></button>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>

          {/* Quotations List Section */}
          <div className="pt-10 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black italic uppercase text-slate-900 leading-none mb-1">Proposed Quotations</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Revenue Nodes & Propositions</p>
              </div>
              <Link to={`/quotations/new?lead_id=${lead.id}`} className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase italic flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                <Plus className="w-3.5 h-3.5" /> Initialize Proposal
              </Link>
            </div>

            {quotations.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center">
                <p className="text-sm font-bold text-slate-300 italic mb-4">No quotations constructed for this lead yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotations.slice(0, 4).map(q => (
                  <Link key={q.id} to={`/quotations/${q.id}`} className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-600 transition-all shadow-sm flex flex-col justify-between h-40">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-tighter">{q.quote_number}</span>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                          q.status === 'accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                        )}>{q.status}</span>
                      </div>
                      <h4 className="text-sm font-black italic uppercase text-slate-800 line-clamp-1">{q.title}</h4>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-slate-50 italic">
                      <span className="text-xs font-black text-slate-900">{formatINR(q.total_amount)}</span>
                      <span className="text-[10px] font-bold text-slate-400">{timeAgo(q.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {quotations.length > 4 && (
              <div className="text-center">
                <Link to={`/quotations?lead_id=${lead.id}`} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline decoration-2 underline-offset-8">View all {quotations.length} Propositions →</Link>
              </div>
            )}
          </div>

          {/* Bookings Section */}
          <div className="pt-10 space-y-8">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black italic uppercase text-slate-900 leading-none mb-1">Operational Fleet</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active & Confirmed Missions</p>
                </div>
                <button onClick={() => setIsBookingDrawerOpen(true)} className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase italic flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-100">
                   <Plus className="w-3.5 h-3.5 text-emerald-400" /> Initialize Mission
                </button>
             </div>

             {bookings.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-16 text-center">
                   <p className="text-sm font-bold text-slate-300 italic">No operational missions mapped to this lead.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {bookings.map((bk: Booking) => (
                      <Link key={bk.id} to={`/bookings/${bk.id}`} className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-600 transition-all shadow-sm flex flex-col justify-between h-44">
                         <div>
                            <div className="flex justify-between items-start mb-4">
                               <span className="text-[10px] font-mono font-black text-indigo-600 uppercase tracking-tighter">{bk.booking_number}</span>
                               <span className={clsx(
                                 "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100 bg-emerald-50 text-emerald-600"
                               )}>{bk.status}</span>
                            </div>
                            <h4 className="text-base font-black italic uppercase text-slate-900 leading-tight mb-1 line-clamp-1">{bk.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase italic flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {bk.destination}</p>
                         </div>
                         <div className="flex justify-between items-end pt-4 border-t border-slate-50 italic">
                            <span className="text-[10px] font-black text-slate-900 uppercase">{new Date(bk.travel_date_start).toDateString()}</span>
                            <span className="text-[10px] font-bold text-indigo-400">View Protocol →</span>
                         </div>
                      </Link>
                   ))}
                </div>
             )}
          </div>

          {/* Visa Applications Section */}
          <div className="pt-10 space-y-8">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black italic uppercase text-slate-900">Visa Applications</h3>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Compliance Pipeline</p>
                </div>
                <button onClick={() => setIsVisaDrawerOpen(true)} className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase italic flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-100">
                   <Plus className="w-3.5 h-3.5 text-indigo-400" /> New Application
                </button>
             </div>

             {visas.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-20 text-center">
                   <p className="text-sm font-bold text-slate-300 italic mb-4">No visa nodes detected for this project.</p>
                   <button onClick={() => setIsVisaDrawerOpen(true)} className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">+ Initialize Compliance Node</button>
                </div>
             ) : (
                <div className="space-y-6">
                   {visas.map((v: any) => (
                      <VisaCard 
                         key={v.id} 
                         visa={v} 
                         onStatusChange={(s) => vUpdateStatus(v.id, s as any)} 
                         onHolderChange={(h) => vUpdateHolder(v.id, h as any)}
                         onDocUpdate={(type, status) => vUpdateDoc(v.id, type, status)}
                      />
                   ))}
                </div>
             )}
          </div>
        </div>

        {/* Lead Info Panel (Right) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Visa Alerts & Summary */}
          {visas.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-4 border-b border-slate-100 bg-indigo-50/30 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                     <Stamp className="w-3.5 h-3.5" /> Compliance Summary
                  </span>
               </div>
               <div className="p-5 space-y-4">
                  {vAlerts.length > 0 && (
                    <div className="space-y-2">
                       {vAlerts.slice(0, 3).map((a, i) => (
                         <div key={i} className={clsx(
                           "p-3 rounded-xl border flex items-center gap-3 animate-in slide-in-from-right-2 duration-300",
                           a.priority === 'red' ? "bg-red-50 border-red-100 text-red-700" :
                           a.priority === 'amber' ? "bg-amber-50 border-amber-100 text-amber-700" : "bg-blue-50 border-blue-100 text-blue-700"
                         )}>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="text-[10px] font-black uppercase leading-tight">{a.message}</p>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                      <div className="text-center">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Travelers</p>
                         <p className="text-lg font-black text-slate-900 italic leading-none">{visas.length}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1 underline decoration-emerald-200 font-mono">Approved</p>
                         <p className="text-lg font-black text-emerald-600 italic leading-none">{visas.filter(v => v.status === 'approved').length}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1 underline decoration-red-200 font-mono">Rejected</p>
                         <p className="text-lg font-black text-red-600 italic leading-none">{visas.filter(v => v.status === 'rejected').length}</p>
                      </div>
                  </div>

                  <div className="space-y-2">
                     {visas.map((v: any) => (
                       <div key={v.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-all group">
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-900">{v.traveler_name}</p>
                             <p className="text-[8px] font-bold text-slate-400 tracking-widest">{v.destination} • {v.visa_type}</p>
                          </div>
                          <span className={clsx(
                            "px-2 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest border",
                            v.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            v.status === 'rejected' ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-400"
                          )}>{v.status.replace('_', ' ')}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {/* Booking Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                   <ShieldCheck className="w-3.5 h-3.5" /> Operational Node
                </span>
                {!booking && <button onClick={() => setIsBookingDrawerOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Convert</button>}
             </div>
             <div className="p-5">
                {booking ? (
                  <Link to={`/bookings/${booking.id}`} className="block border border-indigo-100 rounded-xl p-3 bg-indigo-50/20 group hover:border-indigo-300 transition-all">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black font-mono text-indigo-600 tracking-tighter uppercase">{booking.booking_number}</span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-blue-50 text-blue-600">{booking.status}</span>
                     </div>
                     <p className="text-sm font-black italic uppercase text-slate-900 leading-tight mb-1">{booking.destination || 'Global Trip'}</p>
                     <p className="text-[10px] font-bold text-slate-400">{booking.travel_date_start ? new Date(booking.travel_date_start).toDateString() : 'TBD'}</p>
                  </Link>
                ) : (
                  <div className="text-center py-4">
                     <p className="text-xs font-bold text-slate-400 italic mb-3 text-center">No operational booking record.</p>
                     <button onClick={() => setIsBookingDrawerOpen(true)} className="w-full py-2.5 bg-indigo-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">Create Booking Record</button>
                  </div>
                )}
             </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-100 bg-emerald-50/20 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                   <CheckSquare className="w-3.5 h-3.5" /> Tasks Stack
                </span>
                <button onClick={() => setIsVisaDrawerOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">+ Add</button>
             </div>
             <div className="p-5 space-y-4">
                {/* We'll use a local subset of tasks or fetch specifically */}
                <p className="text-[8px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Pending Operations</p>
                <div className="space-y-3">
                   {/* Placeholder for local tasks logic integration */}
                   <div className="flex items-center gap-3 group/task">
                      <div className="w-4 h-4 rounded border-2 border-slate-200 cursor-pointer group-hover/task:border-indigo-600"></div>
                      <span className="text-[10px] font-black uppercase text-slate-900 truncate">VFS Submission Due</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border-2 border-slate-200"></div>
                      <span className="text-[10px] font-black uppercase text-slate-900 truncate">Collect Passport Docs</span>
                   </div>
                </div>
                <Link to="/tasks" className="block text-center pt-4 text-[8px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all italic">View full stack node →</Link>
             </div>
          </div>

          {/* Trip Details Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <MapPin className="w-3.5 h-3.5" /> Trip Details
                </span>
                <button onClick={() => setIsEditDrawerOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Edit</button>
             </div>
             <div className="p-5 space-y-4">
                <div className="flex justify-between items-center py-1">
                   <span className="text-xs font-bold text-slate-400 uppercase">Destination</span>
                   <span className="text-sm font-bold text-slate-900">{lead.destination || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                   <span className="text-xs font-bold text-slate-400 uppercase">Start Date</span>
                   <span className="text-sm font-bold text-slate-900">{lead.travel_start_date ? new Date(lead.travel_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                   <span className="text-xs font-bold text-slate-400 uppercase">Stay</span>
                   <span className="text-sm font-bold text-slate-900">
                      {lead.checkin_date ? `${new Date(lead.checkin_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })} → ${lead.checkout_date ? new Date(lead.checkout_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }) : '?'}` : '—'}
                   </span>
                </div>
                <div className="flex justify-between items-center py-1">
                   <span className="text-xs font-bold text-slate-400 uppercase">Guests / Rooms</span>
                   <span className="text-sm font-bold text-slate-900">{lead.guests} Pax | {lead.rooms} Rooms</span>
                </div>
             </div>
          </div>

          {/* Financial Summary Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <DollarSign className="w-3.5 h-3.5" /> Financial Snapshot
                </span>
             </div>
             <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-400 uppercase">Client Budget</span>
                   <span className="text-sm font-black text-slate-900">{formatINR(lead.budget)}</span>
                </div>
                <div className="h-px bg-slate-50"></div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-400 uppercase">Final Price</span>
                   <span className="text-sm font-black text-indigo-700">{formatINR(lead.selling_price)}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-400 uppercase">Vendor Cost</span>
                   <span className="text-sm font-bold text-slate-600">{formatINR(lead.cost_price)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 mt-2">
                   <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Estimated Profit</span>
                      <span className={cn("text-base font-black italic", lead.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                         {formatINR(lead.profit)}
                      </span>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Margin</span>
                      <span className={cn(
                        "text-xs font-black px-2 py-0.5 rounded-full border",
                        lead.margin > 15 && "bg-emerald-50 text-emerald-600 border-emerald-100",
                        lead.margin <= 15 && lead.margin >= 5 && "bg-yellow-50 text-yellow-600 border-yellow-100",
                        lead.margin < 5 && "bg-red-50 text-red-600 border-red-100"
                      )}>
                         {lead.margin.toFixed(1)}%
                      </span>
                   </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                   <span className="text-xs font-bold text-slate-400 uppercase">Collected</span>
                   <span className="text-sm font-bold text-slate-900">{formatINR(lead.amount_collected)}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-400 uppercase">Outstanding</span>
                   <span className={cn("text-sm font-black uppercase tracking-tighter", outstandingAmt > 0 ? "text-red-600 underline underline-offset-4 decoration-2" : "text-emerald-600")}>
                      {outstandingAmt > 0 ? formatINR(outstandingAmt) : 'FULL CLEAN'}
                   </span>
                </div>
             </div>
          </div>

          {/* Pending Follow-ups */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Clock className="w-3.5 h-3.5" /> Pending Follow-ups
                </span>
             </div>
             <div className="p-5">
                {followups.filter(f => !f.is_done).length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic text-center py-4">No pending follow-ups</p>
                ) : (
                  <div className="space-y-4">
                     {followups.filter(f => !f.is_done).map(f => (
                       <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-1.5">
                                {new Date(f.due_date) < new Date() && <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>}
                                <span className={cn("text-[10px] font-bold uppercase tracking-tight", new Date(f.due_date) < new Date() ? "text-red-600" : "text-slate-500")}>
                                   {formatAbsoluteDate(f.due_date)}
                                </span>
                             </div>
                             <button onClick={() => markFUDone(f.id)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Done</button>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 italic">{f.note || 'No description'}</p>
                       </div>
                     ))}
                  </div>
                )}
                <button 
                  onClick={() => setActiveForm('followup')}
                  className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-600 flex items-center justify-center gap-2 hover:bg-indigo-50 py-2 rounded-lg transition-colors border border-dashed border-indigo-200"
                >
                   <Plus className="w-3.5 h-3.5" /> Add Follow-up
                </button>
             </div>
          </div>

          {/* Quotations Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                   <FileText className="w-3.5 h-3.5" /> Proposed Quotations
                </span>
                <Link to={`/quotations/new?lead_id=${lead.id}`} className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Create</Link>
             </div>
             <div className="p-5">
                {quotations.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic text-center py-4">No proposals generated yet</p>
                ) : (
                  <div className="space-y-4">
                     {quotations.map(q => (
                       <Link key={q.id} to={`/quotations/${q.id}`} className="block p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                             <span className="text-[10px] font-black text-slate-900 font-mono tracking-tighter uppercase">{q.quote_number}</span>
                             <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-white">{q.status}</span>
                          </div>
                          <p className="text-sm font-black italic text-slate-700">{formatINR(q.total_amount)}</p>
                       </Link>
                     ))}
                  </div>
                )}
             </div>
          </div>

          {/* Invoices Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                   <Receipt className="w-3.5 h-3.5" /> Finance & Invoices
                </span>
                <Link to={`/invoices/new?lead_id=${lead.id}`} className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Create</Link>
             </div>
             <div className="p-5">
                {invoices.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic text-center py-4">No invoices issued yet</p>
                ) : (
                  <div className="space-y-4">
                     {invoices.map((inv: Invoice) => (
                       <Link key={inv.id} to={`/invoices/${inv.id}`} className="block p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                             <span className="text-[10px] font-black text-slate-900 font-mono tracking-tighter uppercase">{inv.invoice_number}</span>
                             <span className={clsx(
                               "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border bg-white",
                               inv.status === 'paid' ? "text-emerald-600 border-emerald-100" : "text-slate-400"
                             )}>{inv.status}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <p className="text-sm font-black italic text-slate-700">{formatINR(inv.total_amount)}</p>
                             {Number(inv.total_amount) - Number(inv.amount_paid) > 0 && (
                               <span className="text-[8px] font-black text-red-500 uppercase">Due: {formatINR(Number(inv.total_amount) - Number(inv.amount_paid))}</span>
                             )}
                          </div>
                       </Link>
                     ))}
                  </div>
                )}
             </div>
          </div>

          {/* Metadata Section */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm opacity-60 hover:opacity-100 transition-opacity">
             <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Info className="w-3.5 h-3.5" /> Lead Meta
                </span>
             </div>
             <div className="p-5 text-xs space-y-3">
                <div className="flex justify-between">
                   <span className="text-slate-400">Lead ID</span>
                   <span className="font-mono text-[10px] text-slate-500">#{lead.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-400">Created</span>
                   <span className="font-bold text-slate-500">{new Date(lead.created_at).toDateString()}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-400">Source</span>
                   <span className="font-bold text-slate-900 capitalize">{lead.source}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <EditLeadDrawer 
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        lead={lead}
        onSuccess={(updated) => {
          setLead(updated);
          showToast('Lead updated');
          refreshLead();
        }}
      />

      <CreateCustomerDrawer 
        isOpen={isConvertDrawerOpen}
        onClose={() => setIsConvertDrawerOpen(false)}
        onSuccess={handleConversionSuccess}
        initialData={{
          name: lead.customer_name,
          phone: lead.customer_phone,
          email: lead.customer_email || undefined
        }}
      />

      {/* Toast Overlay */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 z-[100] flex items-center gap-3",
          toast.type === 'success' ? "bg-indigo-600 text-white border-indigo-500" : "bg-red-600 text-white border-red-500"
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      <CreateBookingDrawer 
        isOpen={isBookingDrawerOpen}
        onClose={() => setIsBookingDrawerOpen(false)}
        onSuccess={(b) => {
           setBooking(b);
           showToast(`Converted to Booking: ${b.booking_number}`);
           refreshLead();
        }}
        initialData={{
           destination: lead.destination || '',
           travel_date_start: lead.travel_start_date || '',
           customer_id: lead.customer_id || undefined,
           lead_id: lead.id,
           selling_price: lead.selling_price || 0
        }}
      />
      <CreateVisaDrawer 
        isOpen={isVisaDrawerOpen}
        onClose={() => setIsVisaDrawerOpen(false)}
        initialData={{ 
           lead_id: lead.id,
           customer_id: lead.customer_id || '',
           visa_country: lead.destination || ''
        }}
      />
      <CreateBookingDrawer 
        isOpen={isBookingDrawerOpen}
        onClose={() => { setIsBookingDrawerOpen(false); fetchRelatedData(); }}
        preFillLeadId={lead.id}
      />
    </div>
  );
};

// Visa Card Internal Component
const VisaCard = ({ visa, onStatusChange, onHolderChange, onDocUpdate }: { visa: any, onStatusChange: (s: string) => void, onHolderChange: (h: string) => void, onDocUpdate: (t: string, s: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const docTypes = ['passport', 'photo', 'bank_statement', 'itr', 'salary_slip', 'employment_letter', 'hotel_booking', 'flight_itinerary', 'travel_insurance', 'cover_letter', 'noc', 'other'];

  const getDocStatus = (type: string) => visa.documents?.find((d: any) => d.doc_type === type)?.status || 'pending';

  const readyDocs = (visa.documents || []).filter((d: any) => ['uploaded', 'verified'].includes(d.status)).length;
  const activeDocs = docTypes.filter(t => getDocStatus(t) !== 'not_needed').length;
  const progress = (readyDocs / activeDocs) * 100;

  const statusMap = {
     not_started: 0, docs_collecting: 1, docs_collected: 2, applied: 3, in_process: 4, approved: 5, rejected: 5
  };

  return (
    <div className={clsx("bg-white border-2 rounded-[2.5rem] transition-all overflow-hidden", isExpanded ? "border-indigo-600 shadow-2xl" : "border-slate-100 hover:border-slate-300 shadow-sm")}>
       <div className="p-8 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black italic text-slate-400">01</div>
                <div>
                   <h4 className="text-xl font-black italic uppercase text-slate-900 tracking-tight">{visa.traveler_name}</h4>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{visa.destination} • {visa.visa_type} Sequence</p>
                </div>
             </div>
             <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <select className={clsx(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border outline-none",
                  visa.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  visa.status === 'rejected' ? "bg-red-50 text-red-600 border-red-100" :
                  visa.status === 'applied' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-400 border-slate-200"
                )} value={visa.status} onChange={e => onStatusChange(e.target.value)}>
                   {Object.keys(statusMap).map((s: any) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <div className={clsx("p-2 rounded-xl transition-all", isExpanded ? "rotate-45" : "rotate-0")}>
                   <Plus className="w-5 h-5 text-slate-300" />
                </div>
             </div>
          </div>
          {!isExpanded && (
            <div className="flex items-center gap-8 px-1">
               <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[10px] font-black uppercase text-slate-500 italic">Custody: {visa.passport_holder}</span>
               </div>
               <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[10px] font-black uppercase text-slate-500 italic">Expect: {visa.expected_date || 'TBD'}</span>
               </div>
               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
               </div>
            </div>
          )}
       </div>

       {isExpanded && (
          <div className="px-10 pb-10 space-y-12 animate-in slide-in-from-top-4 duration-300">
             {/* Section A: Details Grid */}
             <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-8 space-y-10">
                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <p className="text-[8px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Passport Custody Node</p>
                         <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                            {['customer', 'agency', 'vfs', 'embassy', 'returned'].map(h => (
                               <button 
                                 key={h} 
                                 onClick={() => onHolderChange(h as any)}
                                 className={clsx(
                                   "flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1",
                                   visa.passport_holder === h ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:bg-white/50"
                                 )}
                               >
                                  {h === 'agency' && visa.passport_holder === 'agency' && <div className="w-1 h-1 bg-red-400 rounded-full animate-ping"></div>}
                                  {h}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div>
                         <p className="text-[8px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Fees Ledger</p>
                         <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center group">
                            <div>
                               <p className="text-[7px] font-black text-white/30 uppercase leading-none mb-1">Total Receivable</p>
                               <p className="text-sm font-black italic">{formatINR(Number(visa.visa_fee) + Number(visa.service_charge))}</p>
                            </div>
                            <span className="text-[7px] font-black uppercase border border-white/20 px-2 py-1 rounded italic">{visa.fee_paid_by}</span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-6">
                      <DetailNode label="Submission" val={visa.submission_date} icon={Rocket} />
                      <DetailNode label="Decision Expect" val={visa.expected_date} icon={Clock} color={visa.expected_date && new Date(visa.expected_date) < new Date() ? 'text-red-500' : ''} />
                      <DetailNode label="Appointment" val={visa.appointment_date} icon={Calendar} />
                   </div>
                </div>

                <div className="md:col-span-4 bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 h-full">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">Checklist <span>{readyDocs}/{activeDocs}</span></h5>
                   <div className="space-y-3 overflow-y-auto max-h-[300px] no-scrollbar">
                      {docTypes.map(t => (
                        <div key={t} className="flex items-center gap-3">
                           <DocIcon status={getDocStatus(t)} />
                           <span className={clsx("text-[9px] font-black uppercase grow truncate", getDocStatus(t) === 'not_needed' && "line-through text-slate-300 italic")}>{t.replace('_', ' ')}</span>
                           <select 
                             className="text-[8px] font-black uppercase border-none bg-transparent text-indigo-600 outline-none"
                             value={getDocStatus(t)}
                             onChange={e => onDocUpdate(t, e.target.value)}
                           >
                              <option value="pending">Pending</option>
                              <option value="uploaded">Uploaded</option>
                              <option value="verified">Verified</option>
                              <option value="not_needed">Skip</option>
                           </select>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Progress Status Bar */}
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3 flex-1 overflow-x-auto no-scrollbar">
                   {['not_started', 'docs_collected', 'applied', 'in_process', 'approved'].map((s, i) => (
                      <React.Fragment key={s}>
                         <div className="flex flex-col items-center gap-3 group">
                            <div className={clsx(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-700",
                              statusMap[visa.status as keyof typeof statusMap] >= statusMap[s as keyof typeof statusMap] ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-100"
                            )}>
                               <Check className={clsx("w-3 h-3 text-white transition-opacity", statusMap[visa.status as keyof typeof statusMap] >= statusMap[s as keyof typeof statusMap] ? "opacity-100" : "opacity-0")} />
                            </div>
                            <span className={clsx("text-[7px] font-black uppercase tracking-widest whitespace-nowrap", statusMap[visa.status as keyof typeof statusMap] >= statusMap[s as keyof typeof statusMap] ? "text-indigo-600" : "text-slate-300")}>{s.replace('_', ' ')}</span>
                         </div>
                         {i < 4 && <div className={clsx("h-px flex-1 min-w-[20px]", statusMap[visa.status as keyof typeof statusMap] > statusMap[s as keyof typeof statusMap] ? "bg-indigo-600" : "bg-slate-100")}></div>}
                      </React.Fragment>
                   ))}
                </div>
             </div>

             {visa.status === 'rejected' && (
                <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600 animate-in shake duration-500">
                   <AlertCircle className="w-6 h-6 shrink-0" />
                   <div>
                      <p className="text-[10px] font-black uppercase italic tracking-widest">Application Rejected</p>
                      <p className="text-xs font-bold leading-relaxed">{visa.rejection_reason || 'No specific rejection context provided by diplomatic node.'}</p>
                   </div>
                </div>
             )}
          </div>
       )}
    </div>
  );
};

const DetailNode = ({ label, val, icon: Icon, color = 'text-slate-900' }: any) => (
  <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-3">
     <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300"><Icon className="w-4 h-4" /></div>
     <div>
        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">{label}</p>
        <p className={clsx("text-xs font-black italic", color)}>{val || 'TBD'}</p>
     </div>
  </div>
);

const DocIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'verified': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case 'uploaded': return <Package className="w-3.5 h-3.5 text-blue-500" />;
    case 'not_needed': return <X className="w-3.5 h-3.5 text-slate-200" />;
    default: return <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-100"></div>;
  }
};
