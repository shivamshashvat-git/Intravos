import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, CheckCircle, XCircle, Clock, 
  MapPin, Calendar, Users, Briefcase, FileText, 
  Plus, MoreVertical, Flag, ShieldCheck, Plane, 
  Building2, Car, Activity, Target, Shield, 
  PhoneCall, Download, Hash, Clipboard, User,
  Navigation, Globe, ExternalLink, ArrowRight, ChevronRight
} from 'lucide-react';
import { useBookingDetail } from '../hooks/useBookingDetail';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { BookingStatus, BookingPriority, ServiceType } from '../types/booking';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { visaService } from '../services/visaService';
import { CreateVisaDrawer } from '../components/CreateVisaDrawer';

type TabType = 'overview' | 'travelers' | 'documents' | 'notes';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { 
    booking, isLoading, updateStatus, addService, 
    deleteService, addMember, deleteMember, updateBookingValue 
  } = useBookingDetail(id!);
  const [visas, setVisas] = useState<any[]>([]);

  useEffect(() => {
    if (id && tenant?.id) {
       visaService.getBookingVisas(id, tenant.id).then(setVisas);
    }
  }, [id, tenant?.id]);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (isLoading || !booking) return <div className="h-screen flex items-center justify-center font-black italic text-slate-300 uppercase tracking-widest">Hydrating Operational Node...</div>;

  const handleExportManifest = () => {
    if (!booking.members || booking.members.length === 0) return toast.error('No traveler nodes detected');
    const headers = ['Name', 'Relationship', 'DOB', 'Passport', 'Expiry', 'Nationality', 'Phone', 'Visa Status'];
    const rows = booking.members.map(m => [
      m.name, m.gender || '', m.date_of_birth || '', m.passport_number || '', 
      m.passport_expiry || '', m.nationality, m.phone || '', m.visa_status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Manifest_${booking.booking_number}.csv`;
    a.click();
    toast.success('Manifest Exported Successfully');
  };

  const today = new Date().toISOString().split('T')[0];
  const isDepartingToday = booking.travel_date_start === today;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      {/* Header Section */}
      <section className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-12">
         <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -mr-40 -mt-40 -z-10" />
         
         <div className="space-y-10 flex-1">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate('/bookings')} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
               <div className="flex items-center gap-4">
                  <span className="text-xl font-mono font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full italic tracking-tighter">{booking.booking_number}</span>
                  <StatusBadge status={booking.status} />
                  <PriorityBadge priority={booking.priority} />
               </div>
            </div>

            <div>
               <h1 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-6">{booking.title}</h1>
               <div className="flex flex-wrap gap-8 items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><MapPin className="w-5 h-5" /></div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Target Location</p>
                        <p className="text-sm font-black italic uppercase text-slate-900">{booking.destination}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 border-l border-slate-100 pl-8">
                     <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Chrono Window</p>
                        <p className="text-sm font-black italic uppercase text-slate-900">{new Date(booking.travel_date_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {new Date(booking.travel_date_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 border-l border-slate-100 pl-8">
                     <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Users className="w-5 h-5" /></div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Personnel Count</p>
                        <p className="text-sm font-black italic uppercase text-slate-900">{booking.total_pax} Traveler Node(s)</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-end justify-between min-w-[340px]">
            <div className="text-right space-y-3">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tactical Actions</p>
               <div className="flex flex-col gap-3">
                  {booking.status === 'confirmed' && (
                    <button onClick={() => updateStatus('in_progress')} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black italic uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all outline outline-offset-4 outline-indigo-100">
                       <Flag className="w-5 h-5" /> Commencing Mission
                    </button>
                  )}
                  {booking.status === 'in_progress' && (
                    <button onClick={() => updateStatus('completed')} className="px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black italic uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all outline outline-offset-4 outline-emerald-100">
                       <CheckCircle className="w-5 h-5" /> Resolve Mission
                    </button>
                  )}
                  {['confirmed', 'in_progress', 'on_hold'].includes(booking.status) && (
                    <button onClick={() => {
                        const reason = window.prompt('Mission Termination Reason:');
                        if (reason) updateStatus('cancelled', reason);
                    }} className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic hover:underline">Terminate Protocol</button>
                  )}
               </div>
            </div>
            
            <div className="flex gap-4 pt-10">
               <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm"><Download className="w-5 h-5" /></button>
               <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm"><Plus className="w-5 h-5" /></button>
            </div>
         </div>
      </section>

      {/* Alert Banner */}
      {isDepartingToday && (
         <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-6 animate-pulse px-12 italic">
            <Plane className="w-8 h-8" />
            <p className="text-xl font-black uppercase tracking-tighter">Mission Deployment Commencing Today — Monitor Logistics Fluidity</p>
         </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 px-8">
         {(['overview', 'travelers', 'documents', 'notes'] as TabType[]).map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={clsx(
               "px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
               activeTab === tab ? "text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-indigo-600" : "text-slate-400 hover:text-slate-600"
             )}
           >
              {tab}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px] animate-in slide-in-from-bottom-2 duration-300">
         {activeTab === 'overview' && (
           <div className="grid grid-cols-12 gap-12">
              {/* Left Side: Services */}
              <div className="col-span-12 lg:col-span-8 space-y-12">
                 <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                       <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                          <Briefcase className="w-4 h-4 text-indigo-500" /> Tactical Service Nodes
                       </h3>
                       <button onClick={() => setIsServiceFormOpen(true)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-black transition-all">Add Node</button>
                    </div>

                    <div className="divide-y divide-slate-50 italic">
                       {(booking.services || []).length === 0 ? (
                         <div className="p-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No Tactical Nodes Mapped</div>
                       ) : (
                         booking.services?.map(s => (
                           <div key={s.id} className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-8">
                                 <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 shadow-sm group-hover:text-indigo-600 transition-colors">
                                    <ServiceIcon type={s.service_type} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-indigo-600 mb-1 leading-none uppercase tracking-tighter">{s.service_type} Node</p>
                                    <h4 className="text-base font-black text-slate-900 uppercase leading-tight mb-1">{s.description}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.provider || 'Provider Anonymous'} • {s.confirmation_number || 'TBD'}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-12 text-right">
                                 <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1 leading-none">Status</p>
                                    <span className={clsx(
                                       "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                       s.status === 'confirmed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                    )}>{s.status}</span>
                                 </div>
                                 {isAdmin && (
                                   <div className="w-24">
                                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 leading-none">Net Node</p>
                                      <p className="text-sm font-black text-slate-900">{formatINR(s.selling_price)}</p>
                                   </div>
                                 )}
                                 <button onClick={() => deleteService(s.id)} className="p-2.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><XCircle className="w-5 h-5" /></button>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                 </div>

                 {/* Financial Overview (Admin Only) */}
                 {isAdmin && (
                   <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                      <IndianRupee className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-5" />
                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12">
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">Authorized Revenue</p>
                            <h4 className="text-4xl font-black italic tracking-tighter leading-none">{formatINR(booking.selling_price)}</h4>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">Supply Expense</p>
                            <h4 className="text-4xl font-black italic tracking-tighter text-rose-400 leading-none">{formatINR(booking.cost_price)}</h4>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">Tactical Surplus</p>
                            <h4 className="text-4xl font-black italic tracking-tighter text-emerald-400 leading-none">{formatINR(booking.profit)}</h4>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">Surplus Efficiency</p>
                            <h4 className="text-4xl font-black italic tracking-tighter leading-none">{Math.round(booking.margin_percentage)}%</h4>
                         </div>
                      </div>

                      <div className="mt-12 pt-12 border-t border-white/5 flex items-center justify-between italic">
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Revenue Status:</span>
                            <span className={clsx(
                              "text-xs font-black p-2 rounded-xl",
                              booking.amount_outstanding > 0 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                            )}>{booking.amount_outstanding > 0 ? `Unsettled: ${formatINR(booking.amount_outstanding)}` : 'Node fully stabilized'}</span>
                         </div>
                         <Link to={booking.invoice_id ? `/invoices/${booking.invoice_id}` : '#'} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-all underline underline-offset-8">Jump to Billing Node →</Link>
                      </div>
                   </div>
                 )}

                  {/* Visa Overview Section */}
                  <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl">
                     <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                        <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" /> Operational Visa Node(s)
                        </h3>
                        <button 
                           onClick={() => setIsDrawerOpen(true)}
                           className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-black transition-all"
                        >
                           Deploy Visa Node
                        </button>
                     </div>

                     <div className="divide-y divide-slate-50 italic">
                        {visas.length === 0 ? (
                          <div className="p-20 text-center text-slate-200 font-bold uppercase text-[10px] tracking-[0.5em] italic">No Visa Nodes Initialized</div>
                        ) : (
                          visas.map(v => (
                            <div key={v.id} className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/visa/${v.id}`)}>
                               <div className="flex items-center gap-8">
                                  <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                     <Globe className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <h4 className="text-base font-black text-slate-900 uppercase leading-tight mb-1">{v.traveler_name}</h4>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{v.visa_country} ({v.visa_type})</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-12 text-right">
                                  <div>
                                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1 leading-none">Workflow</p>
                                     <span className={clsx(
                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                        v.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                     )}>{v.status.replace(/_/g, ' ')}</span>
                                  </div>
                                  <div>
                                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1 leading-none">Custody</p>
                                     <span className="text-[9px] font-black text-slate-950 uppercase">{v.passport_custody.replace(/_/g, ' ')}</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-600 transition-all" />
                               </div>
                            </div>
                          ))
                        )}
                     </div>
                  </div>
              </div>

              {/* Right Side: Operational Meta */}
              <div className="col-span-12 lg:col-span-4 space-y-12">
                 <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl space-y-10">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                       <Clipboard className="w-4 h-4 text-emerald-500" /> Operational Overlays
                    </h3>
                    
                    <div className="space-y-8">
                       <PNRField label="Flight Mission PNR" value={booking.flight_pnr} />
                       <PNRField label="Hotel Conf Key" value={booking.hotel_confirmation} />
                       <PNRField label="Tactical Transfer" value={booking.transfer_confirmation} />
                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-50 italic">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Special Requirements</p>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed">{booking.special_requirements || 'Standard Mission Params'}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Meal / Dietary</p>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed">{booking.meal_preferences || 'No dietary restrictions'}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Emergency Extraction</p>
                          <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100">
                             <PhoneCall className="w-4 h-4 text-indigo-600" />
                             <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{booking.emergency_contact_name || 'UNDEFINED'}</p>
                                <p className="text-[9px] font-bold text-slate-400">{booking.emergency_contact_phone || 'NO_CONTACT'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Linked Nodes */}
                 <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 space-y-8">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] italic">System Links</h3>
                    <div className="space-y-4">
                       <LinkNode label="CRM Master Record" sub={booking.customer?.name} link={`/customers/${booking.customer_id}`} />
                       <LinkNode label="Revenue Node" sub={booking.invoice?.invoice_number || 'Internal Transfer'} link={booking.invoice_id ? `/invoices/${booking.invoice_id}` : ''} />
                       <LinkNode label="Pre-Mission Proposal" sub={booking.quotation?.quote_number || 'Tactical Start'} link={booking.quotation_id ? `/quotations/${booking.quotation_id}` : ''} />
                    </div>
                 </div>

                 {/* Itinerary Link */}
                 <div className="bg-slate-950 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden group">
                    <Globe className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-all duration-1000" />
                    <h3 className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] italic flex items-center gap-3 relative z-10">
                       <Navigation className="w-4 h-4 text-emerald-400" /> Mission Itinerary
                    </h3>
                    
                    <div className="relative z-10">
                       {(booking as any).itinerary ? (
                         <div className="space-y-6">
                            <div>
                               <p className="text-xl font-black italic uppercase tracking-tighter leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">{(booking as any).itinerary.title}</p>
                               <div className="mt-4 flex flex-wrap gap-2">
                                  <span className="px-2 py-0.5 bg-white/10 rounded text-[8px] font-black uppercase tracking-widest">{(booking as any).itinerary.status}</span>
                                  {(booking as any).itinerary.is_public && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Globe className="w-2 h-2" /> Live Portal</span>}
                               </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                               <Link to={`/itineraries/${(booking as any).itinerary.id}/edit`} className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-center shadow-lg hover:scale-105 transition-all outline outline-offset-2 outline-white/5">Modify Builder</Link>
                               <button onClick={() => window.open(`/share/itinerary/${(booking as any).itinerary.public_slug}`, '_blank')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"><ExternalLink className="w-4 h-4" /></button>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-6 py-4">
                            <p className="text-[10px] font-bold text-white/40 italic">No mission blueprint mapped to this operational node.</p>
                            <button 
                               onClick={() => navigate(`/itineraries/new?booking_id=${booking.id}&destination=${booking.destination}&start_date=${booking.travel_date_start}`)}
                               className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                            >
                               <Plus className="w-3.5 h-3.5" /> Initialize Blueprint
                            </button>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'travelers' && (
           <div className="space-y-12">
              <div className="flex items-center justify-between px-4">
                 <div>
                    <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2">Tactical Manifest</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Detailed node list for all travelers assigned to this mission</p>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={handleExportManifest} className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[9px] font-black uppercase italic tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
                    <button onClick={() => setIsMemberFormOpen(true)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase italic tracking-widest shadow-xl flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400" /> Add Traveler</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                 {(booking.members || []).map(m => (
                   <div key={m.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl group hover:border-indigo-600 transition-all relative overflow-hidden italic">
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => deleteMember(m.id)} className="text-slate-300 hover:text-rose-500"><XCircle className="w-5 h-5" /></button>
                      </div>

                      <div className="flex items-center gap-6 mb-8">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-300 text-2xl uppercase italic">{m.name.charAt(0)}</div>
                         <div>
                            <p className="text-lg font-black text-slate-900 uppercase leading-tight mb-1">{m.name}</p>
                            <span className="px-3 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100">{m.nationality}</span>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <ManifestField label="DOCUMENT_NODE" value={m.passport_number ? `****${m.passport_number.slice(-4)}` : 'NO_DOC'} />
                         <ManifestField label="VISA PROTOCOL" value={m.visa_status} badge />
                         <ManifestField label="DIETARY MAP" value={m.dietary_preferences || 'Standard'} />
                         <ManifestField label="SPECIAL NEEDS" value={m.special_needs || 'None'} />

                         <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[7px] font-black text-slate-300 uppercase mb-1 tracking-widest">Seat Node</p>
                               <p className="text-[10px] font-black text-slate-900">{m.seat_preference || 'Aisle Hub'}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[7px] font-black text-slate-300 uppercase mb-1 tracking-widest">Meal Node</p>
                               <p className="text-[10px] font-black text-slate-900">{m.meal_preference || 'Global'}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
                 {(booking.members || []).length === 0 && (
                   <div className="col-span-full py-40 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] italic">
                      <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-4">Tactical Manifest Empty. Import Personnel.</p>
                      <button onClick={() => setIsMemberFormOpen(true)} className="text-[10px] font-black uppercase text-indigo-600 hover:underline underline-offset-8 transition-all tracking-widest italic">+ Deploy Personnel Node</button>
                   </div>
                 )}
              </div>
           </div>
         )}

         {activeTab === 'documents' && (
           <div className="h-[600px] flex flex-col items-center justify-center italic">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 shadow-sm animate-bounce">
                 <Shield className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black uppercase text-slate-900 italic tracking-tighter mb-2 leading-none underline decoration-indigo-200 decoration-4 underline-offset-4">Document Vault Shielded</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Operational Secure Storage coming in v1.1 Deployment</p>
           </div>
         )}

         {activeTab === 'notes' && (
            <div className="max-w-5xl mx-auto space-y-12 pb-40 px-4">
               <div className="space-y-6">
                  <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] italic flex items-center gap-3">
                     <FileText className="w-4 h-4 text-slate-400" /> Internal Operational Log
                  </h3>
                  <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                     <Target className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-all duration-700" />
                     <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-10 text-sm font-bold italic text-white/90 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all h-[400px]"
                        placeholder="Log tactical mission details, supplier communications, and contingency plans..."
                        defaultValue={booking.internal_notes || ''}
                        onBlur={(e) => updateBookingValue({ internal_notes: e.target.value })}
                     />
                     <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/30 italic">
                        <span>Authorized Personnel Only</span>
                        <span>Auto-commit enabled on blur</span>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>

      {isServiceFormOpen && (
        <ServiceForm id={booking.id} onClose={() => setIsServiceFormOpen(false)} onSubmit={addService} />
      )}
      {isMemberFormOpen && (
        <MemberForm id={booking.id} onClose={() => setIsMemberFormOpen(false)} onSubmit={addMember} />
      )}
      <CreateVisaDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        initialData={{ booking_id: booking.id, customer_id: booking.customer_id }} 
      />
    </div>
  );
};

// Sub-components
const PNRField = ({ label, value }: { label: string, value?: string }) => (
  <div className="space-y-2 group">
     <div className="flex justify-between items-center px-1">
        <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">{label}</label>
        <button onClick={() => { navigator.clipboard.writeText(value || ''); toast.success('Key Captured to Clipboard'); }} className="opacity-0 group-hover:opacity-100 transition-all"><Clipboard className="w-3.5 h-3.5 text-indigo-400" /></button>
     </div>
     <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
        <span className={clsx("text-xs font-mono font-black italic", value ? "text-indigo-600" : "text-slate-300")}>{value || 'UNMAPPED_NODE'}</span>
        <Hash className="w-3.5 h-3.5 text-slate-200" />
     </div>
  </div>
);

const ManifestField = ({ label, value, badge }: { label: string, value?: string, badge?: boolean }) => (
  <div className="flex justify-between items-center py-1">
     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     {badge ? (
       <span className={clsx(
         "px-2 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest",
         value === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
       )}>{value}</span>
     ) : (
       <span className="text-[10px] font-black text-slate-900 text-right">{value}</span>
     )}
  </div>
);

const LinkNode = ({ label, sub, link }: { label: string, sub?: string, link: string }) => (
  <Link to={link} className={clsx(
    "p-5 rounded-2xl border transition-all flex items-center justify-between group",
    link ? "bg-white border-slate-200 hover:border-indigo-600 hover:shadow-lg" : "bg-slate-100/50 border-transparent opacity-40 cursor-not-allowed pointer-events-none"
  )}>
     <div>
        <p className="text-[8px] font-black text-slate-300 uppercase mb-1 tracking-widest">{label}</p>
        <p className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{sub || 'UNLINKED'}</p>
     </div>
     <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-600 transition-colors" />
  </Link>
);

const ServiceIcon = ({ type }: { type: ServiceType }) => {
  if (type === 'flight') return <Plane className="w-6 h-6" />;
  if (type === 'hotel') return <Building2 className="w-6 h-6" />;
  if (type === 'transfer') return <Car className="w-6 h-6" />;
  if (type === 'activity') return <Target className="w-6 h-6" />;
  if (type === 'visa') return <FileText className="w-6 h-6" />;
  if (type === 'insurance') return <Shield className="w-6 h-6" />;
  return <Briefcase className="w-6 h-6" />;
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const map: Record<BookingStatus, string> = {
    confirmed: 'bg-emerald-100 text-emerald-600',
    in_progress: 'bg-indigo-100 text-indigo-600',
    completed: 'bg-slate-100 text-slate-500',
    cancelled: 'bg-rose-100 text-rose-600',
    on_hold: 'bg-amber-100 text-amber-600'
  };
  return (
    <span className={clsx("px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic tracking-widest border border-transparent shadow-sm", map[status])}>
      {status.replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: BookingPriority }) => {
  const map: Record<BookingPriority, string> = {
    urgent: 'bg-rose-600 text-white shadow-rose-200',
    high: 'bg-amber-500 text-white shadow-amber-200',
    normal: 'bg-slate-100 text-slate-500 border-slate-200',
    low: 'bg-blue-100 text-blue-500 border-blue-200'
  };
  return (
    <span className={clsx("px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest shadow-lg", map[priority])}>
      {priority}
    </span>
  );
};

const ServiceForm = ({ onClose, onSubmit }: any) => {
  const [data, setData] = useState({ service_type: 'flight' as ServiceType, description: '', provider: '', confirmation_number: '', selling_price: 0, cost_price: 0 });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
       <div className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl space-y-8 animate-in zoom-in-95 duration-200 italic">
          <h3 className="text-xl font-black uppercase text-slate-900 italic tracking-tighter">Initialize Tactical Service</h3>
          <div className="grid grid-cols-2 gap-6">
             <div className="col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descriptor*</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase" placeholder="E.G. EK-503 DEL-DXB" value={data.description} onChange={e => setData({...data, description: e.target.value.toUpperCase()})} />
             </div>
             <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Provider</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase" value={data.provider} onChange={e => setData({...data, provider: e.target.value.toUpperCase()})} />
             </div>
             <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Service Category</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" value={data.service_type} onChange={e => setData({...data, service_type: e.target.value as any})}>
                   <option value="flight">Flight</option>
                   <option value="hotel">Hotel</option>
                   <option value="transfer">Transfer</option>
                   <option value="activity">Activity</option>
                </select>
             </div>
          </div>
          <div className="flex gap-4 pt-6">
             <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Abort</button>
             <button onClick={() => { onSubmit(data); onClose(); }} className="flex-2 px-10 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-xl">Commit Node</button>
          </div>
       </div>
    </div>
  );
};

const MemberForm = ({ onClose, onSubmit }: any) => {
  const [data, setData] = useState({ name: '', nationality: 'Indian', phone: '', visa_status: 'not_required' as any });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
       <div className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl space-y-8 animate-in zoom-in-95 duration-200 italic">
          <h3 className="text-xl font-black uppercase text-slate-900 italic tracking-tighter">Register Personnel Node</h3>
          <div className="space-y-6">
             <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Legal Identity*</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase" placeholder="NAME AS PER PASSPORT" value={data.name} onChange={e => setData({...data, name: e.target.value.toUpperCase()})} />
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nationality</label>
                   <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase" value={data.nationality} onChange={e => setData({...data, nationality: e.target.value.toUpperCase()})} />
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Comm Node (Phone)</label>
                   <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
                </div>
             </div>
          </div>
          <div className="flex gap-4 pt-6">
             <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Abort</button>
             <button onClick={() => { onSubmit(data); onClose(); }} className="flex-2 px-10 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl shadow-emerald-100">Deploy Personnel Node</button>
          </div>
       </div>
    </div>
  );
};

const IndianRupee = (props: any) => <Clipboard {...props} />;
const MapIcon = (props: any) => <MapPin {...props} />;
const ActivityIcon = (props: any) => <Activity {...props} />;
