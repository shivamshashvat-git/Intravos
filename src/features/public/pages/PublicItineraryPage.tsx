import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  MapPin, Calendar, Clock, Plane, Hotel, 
  Target, Car, Utensils, CheckCircle2,
  Globe, ShieldCheck, ChevronRight, FileText, Lock, Building, Handshake, AlertCircle, RefreshCw, Smartphone
} from 'lucide-react';
import { clsx } from 'clsx';
import { apiClient } from '@/core/lib/apiClient';
import { formatINR } from '@/utils/currency';
import { toast } from 'sonner';

export const PublicItineraryPage: React.FC = () => {
  const { share_token } = useParams<{ share_token: string }>();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPublicData = async () => {
    if (!share_token) return;
    try {
      const res = await apiClient('/api/public/trip/' + share_token);
      const result = await res.json();
      setData(result.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, [share_token]);

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await apiClient(`/api/public/trip/${share_token}/approve`, { method: 'POST' });
      toast.success('Proposal Approved successfully!');
      await fetchPublicData();
    } catch (e: any) {
      toast.error(e.message || 'Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
     const note = window.prompt("What changes would you like to request?");
     if (!note) return;
     setIsActionLoading(true);
     try {
       await apiClient(`/api/public/trip/${share_token}/request-changes`, { 
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ note }) 
       });
       toast.success('Change request sent to your agency.');
     } catch (e: any) {
       toast.error(e.message || 'Action failed');
     } finally {
       setIsActionLoading(false);
     }
  };

  const todayIdx = useMemo(() => {
     if (!data?.trip?.start_date || !data?.itinerary_days?.length) return 0;
     const today = new Date();
     const start = new Date(data.trip.start_date);
     const diffTime = Math.abs(today.getTime() - start.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     
     if (today < start) return 0;
     if (diffDays >= data.itinerary_days.length) return data.itinerary_days.length - 1;
     return diffDays;
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="animate-pulse space-y-8 w-full max-w-3xl">
          <div className="h-64 bg-slate-100 rounded-[3rem]" />
          <div className="space-y-4">
             <div className="h-10 bg-slate-100 rounded-2xl w-3/4" />
             <div className="h-6 bg-slate-100 rounded-xl w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.trip) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 border border-red-100">
           <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic mb-4">Link Unavailable</h1>
        <p className="text-sm font-bold text-slate-400 max-w-md uppercase tracking-widest leading-relaxed">
          This trip is either private or no longer available. 
        </p>
      </div>
    );
  }

  const { trip, itinerary_days, quote_summary, invoices, actions } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white pb-32 font-sans italic">
      {/* Mobile Sticky Action Bar */}
      {(actions.can_pay || actions.can_approve) && (
         <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 md:hidden flex gap-4">
            {actions.can_approve && (
               <button onClick={handleApprove} disabled={isActionLoading} className="flex-1 py-4 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 text-center">
                 Approve Proposal
               </button>
            )}
            {actions.can_pay && invoices[0]?.payment_link_url && (
               <a href={invoices[0].payment_link_url} className="flex-1 py-4 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 text-center block leading-none pt-4.5">
                 Pay Now
               </a>
            )}
         </div>
      )}

      {/* TOP BRADING */}
      <div className="bg-slate-950 text-white px-8 py-6 flex items-center justify-between sticky top-0 z-40">
         <div className="flex items-center gap-3">
             <Building className="w-5 h-5 text-indigo-400" />
             <span className="text-sm font-black uppercase tracking-widest">{trip.agency.name}</span>
         </div>
         {trip.agency.support_phone && (
            <a href={`tel:${trip.agency.support_phone}`} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Support</a>
         )}
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-6 bg-white rounded-b-[4rem] shadow-sm">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            <ShieldCheck className="w-3.5 h-3.5" /> 
            {trip.lifecycle_state === 'proposal' ? 'Trip Proposal' : trip.lifecycle_state === 'confirmed' ? 'Confirmed Booking' : 'Active Travel Plan'}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-slate-950 leading-[0.85] mb-8">
            {trip.title}
          </h1>
          
          {trip.description && (
             <p className="text-sm md:text-base font-bold text-slate-500 max-w-2xl leading-relaxed mb-12 opacity-80">{trip.description}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <div className="flex flex-col items-center gap-3">
               <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <MapPin className="w-6 h-6" />
               </div>
               <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Destination</p>
                  <p className="text-sm font-black uppercase tracking-tight">{trip.destination || 'Global'}</p>
               </div>
            </div>
            
            <div className="flex flex-col items-center gap-3">
               <div className="w-14 h-14 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Clock className="w-6 h-6" />
               </div>
               <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Duration</p>
                  <p className="text-sm font-black uppercase tracking-tight">{trip.duration_days} Days</p>
               </div>
            </div>

            {trip.start_date && (
               <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600">
                     <Calendar className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Departure</p>
                     <p className="text-sm font-black uppercase tracking-tight">{new Date(trip.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12 text-not-italic">
         
         {/* Left Column: Itinerary */}
         <div className="flex-1 space-y-24 italic">
            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Stays', val: trip.stats.hotel_count, icon: Hotel, color: 'text-blue-500', bg: 'bg-blue-50/50' },
                 { label: 'Experiences', val: trip.stats.activity_count, icon: Target, color: 'text-orange-500', bg: 'bg-orange-50/50' },
                 { label: 'Transfers', val: trip.stats.transfer_count, icon: Car, color: 'text-slate-500', bg: 'bg-slate-50/50' },
                 { label: 'Days', val: trip.stats.day_count, icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50/50' }
               ].map((s, idx) => (
                  <div key={idx} className={clsx("p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden", s.bg)}>
                     <s.icon className={clsx("w-6 h-6", s.color)} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{s.label}</span>
                     <span className="absolute -bottom-6 -right-4 text-7xl font-black text-slate-900/5 opacity-50">{s.val}</span>
                  </div>
               ))}
            </div>

            {/* In-Trip View Emphasis */}
            {trip.lifecycle_state === 'traveling' && (
               <div className="p-8 bg-indigo-600 rounded-[3rem] text-white flex items-center justify-between shadow-2xl shadow-indigo-200">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
                        <Smartphone className="w-8 h-8" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">Day {todayIdx + 1} is Live</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-1">Jump to today's tactical sequence</p>
                     </div>
                  </div>
                  <a href={`#day-${todayIdx}`} className="p-4 bg-white text-indigo-600 rounded-2xl hover:scale-105 transition-transform">
                     <ChevronRight className="w-6 h-6" />
                  </a>
               </div>
            )}

            {/* Day By Day */}
            <div className="space-y-24">
               {itinerary_days.map((day: any, dIdx: number) => {
                 const dayDate = trip.start_date ? new Date(trip.start_date) : null;
                 if (dayDate) dayDate.setDate(dayDate.getDate() + (day.day_number - 1));
                 const isToday = trip.lifecycle_state === 'traveling' && dIdx === todayIdx;

                 return (
                   <div key={day.id} id={`day-${dIdx}`} className={clsx("relative", isToday && "ring-4 ring-indigo-500/20 p-8 rounded-[3rem] bg-indigo-50/30 -mx-8")}>
                     {/* Day Header */}
                     <div className="flex items-center gap-6 mb-12">
                        <div className={clsx("flex flex-col items-center justify-center w-24 h-24 rounded-[2rem] shadow-sm transform -rotate-3", isToday ? "bg-indigo-600 text-white" : "bg-white text-slate-900 border border-slate-100")}>
                           <span className={clsx("text-[9px] font-black uppercase tracking-widest", isToday ? "text-indigo-200" : "text-slate-400")}>Day</span>
                           <span className="text-4xl font-black leading-none">{day.day_number}</span>
                        </div>
                        <div className="flex-1">
                           {isToday && <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-full mb-2">Today's Protocol</span>}
                           <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{day.title || 'Mission Sequence'}</h2>
                           {dayDate && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">{dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                        </div>
                     </div>

                     {day.description && (
                       <p className="text-sm font-bold text-slate-500 leading-relaxed mb-10 pl-6 border-l-2 border-slate-200/50">
                          {day.description}
                       </p>
                     )}

                     {/* Items List */}
                     <div className="space-y-6">
                        {day.items.map((item: any) => (
                           <ItemNode key={item.id} item={item} />
                        ))}
                     </div>
                   </div>
                 );
               })}
            </div>
         </div>

         {/* Right Column: Quotes, Invoices, Docs */}
         <div className="w-full lg:w-[400px] shrink-0 space-y-8 italic">
            
            {/* Financial Panel */}
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 sticky top-32">
               {/* Proposal State */}
               {trip.lifecycle_state === 'proposal' && quote_summary && (
                  <div className="space-y-8 animate-in fade-in zoom-in-95">
                     <div className="text-center space-y-2">
                        <span className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest">Pending Approval</span>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900">Total Investment</h3>
                        <p className="text-4xl font-black">{formatINR(quote_summary.total)}</p>
                     </div>
                     <div className="space-y-3">
                        <button onClick={handleApprove} disabled={isActionLoading} className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center">
                           {isActionLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Approve Proposal'}
                        </button>
                        <button onClick={handleRequestChanges} disabled={isActionLoading} className="w-full py-4 bg-slate-50 text-slate-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50">
                           Request Modifications
                        </button>
                     </div>
                  </div>
               )}

               {/* Confirmed / Invoice State */}
               {invoices?.length > 0 && invoices.map((invoice: any) => (
                  <div key={invoice.id} className="space-y-8">
                     <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Invoice {invoice.number}</p>
                           <p className="text-xl font-black uppercase tracking-tighter">{formatINR(invoice.total)}</p>
                        </div>
                        <div className={clsx("px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest", 
                           invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        )}>
                           {invoice.status}
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest py-2">
                           <span className="text-slate-400">Paid</span>
                           <span className="text-emerald-600">{formatINR(invoice.amount_paid)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest py-2">
                           <span className="text-slate-400">Balance</span>
                           <span className="text-slate-900">{formatINR(invoice.balance_due)}</span>
                        </div>
                     </div>

                     {invoice.pay_now_enabled && invoice.payment_link_url && (
                        <a href={invoice.payment_link_url} className="w-full py-5 bg-slate-950 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                           <Lock className="w-4 h-4" /> Secure Checkout
                        </a>
                     )}
                     {invoice.pay_now_enabled && !invoice.payment_link_url && (
                        <div className="text-center p-4 bg-amber-50 rounded-2xl">
                           <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Payment gateway pending setup</p>
                        </div>
                     )}
                  </div>
               ))}
               
               {/* Contact Widget */}
               <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mission Support</h4>
                  <div className="p-5 rounded-3xl bg-slate-50 flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Handshake className="w-5 h-5 text-indigo-500" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">{trip.agency.name}</p>
                        {trip.agency.support_phone && <p className="text-xs font-bold text-slate-500">{trip.agency.support_phone}</p>}
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </main>

    </div>
  );
};

const ItemNode: React.FC<{ item: any }> = ({ item }) => {
  const getTheme = (type: string) => {
    switch (type) {
      case 'hotel': return { icon: Hotel, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'flight': return { icon: Plane, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'activity': return { icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'transfer': return { icon: Car, color: 'text-slate-600', bg: 'bg-slate-100' };
      case 'meal': return { icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      default: return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  const theme = getTheme(item.item_type);

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col md:flex-row gap-6 items-start group">
       <div className={clsx("w-14 h-14 rounded-3xl flex items-center justify-center shrink-0", theme.bg, theme.color)}>
          <theme.icon className="w-6 h-6" />
       </div>
       <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
             <span className="px-3 py-1 rounded-lg bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-500">{item.item_type}</span>
             {item.time_val && <span className="px-3 py-1 rounded-lg bg-indigo-50 text-[8px] font-black uppercase tracking-widest text-indigo-600">{item.time_val}</span>}
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
          {item.description && (
             <p className="text-xs font-bold text-slate-500 leading-relaxed border-l-2 border-slate-100 pl-4">{item.description}</p>
          )}
          
          <div className="flex flex-wrap gap-4 pt-3">
             {item.location && <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400"><MapPin className="w-3 h-3" /> {item.location}</div>}
             {item.duration && <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400"><Clock className="w-3 h-3" /> {item.duration}</div>}
          </div>
       </div>
    </div>
  );
};
