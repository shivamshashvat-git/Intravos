import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, TrendingUp, AlertCircle, CheckSquare, 
  Clock, AlertTriangle, CheckCircle, Zap, RefreshCw,
  ArrowRight, Phone, MessageSquare, Mail, UserPlus,
  Plane, Calendar, MapPin, Search, Plus, StickyNote
} from 'lucide-react';
import { useAuth } from '@/core/hooks/useAuth';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';

export const DashboardPage: React.FC = () => {
  const { user, tenant } = useAuth();
  const { data, isLoading, isRefreshing, lastRefreshed, dismissedAlerts, dismissAlert, refresh } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (!data || (data.leads.active_leads === 0 && data.revenue.invoiced_this_month === 0)) {
     return <EmptyDashboard agencyName={tenant?.name || 'Agency'} />;
  }

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const alerts = [
    { id: 'overdue_inv', type: 'red', icon: AlertCircle, message: `₹${formatINR(data.overdueInvoices.overdue_amount)} overdue across ${data.overdueInvoices.overdue_invoices} invoice(s)`, cta: 'View Invoices', link: '/invoices?filter=overdue', active: data.overdueInvoices.overdue_invoices > 0 },
    { id: 'overdue_tasks', type: 'red', icon: CheckSquare, message: `${data.myTasks.my_overdue_tasks} operation(s) overdue`, cta: 'Fix Now', link: '/tasks?filter=overdue', active: data.myTasks.my_overdue_tasks > 0 },
    { id: 'missed_followups', type: 'amber', icon: Clock, message: `${data.followups.overdue_followups} follow-ups missed`, cta: 'Check Leads', link: '/leads', active: data.followups.overdue_followups > 0 },
    { id: 'departures', type: 'blue', icon: Plane, message: `${data.bookings.departures_today} trip(s) departing today`, cta: 'Ops Hub', link: '/bookings', active: data.bookings.departures_today > 0 },
    { id: 'passports', type: 'blue', icon: StickyNote, message: `${data.visaAlerts.passports_at_agency} passport(s) held at agency`, cta: 'Compliance', link: '/visa', active: data.visaAlerts.passports_at_agency > 0 },
  ].filter(a => a.active && !dismissedAlerts.has(a.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Greeting Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
         <div>
            <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2">
               {getGreeting()}, {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-400 font-bold italic lowercase">
               {tenant?.name} • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
         </div>
         <button onClick={refresh} className="flex items-center gap-2 px-6 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all group">
            <RefreshCw className={clsx("w-3 h-3 group-hover:rotate-180 transition-transform duration-500", isRefreshing && "animate-spin")} />
            Sync Pulse node • {timeAgo(lastRefreshed)}
         </button>
      </div>

      {/* Alert Strip */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
           {alerts.slice(0, 3).map(a => (
             <div key={a.id} className={clsx(
               "p-5 rounded-3xl border flex items-center gap-4 transition-all hover:scale-[1.02] shadow-sm",
               a.type === 'red' ? "bg-red-50 border-red-100 text-red-900" : a.type === 'amber' ? "bg-amber-50 border-amber-100 text-amber-900" : "bg-indigo-50 border-indigo-100 text-indigo-900"
             )}>
                <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", a.type === 'red' ? "bg-red-100" : a.type === 'amber' ? "bg-amber-100" : "bg-indigo-100")}>
                   <a.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black uppercase tracking-widest mb-1 italic">Attention Protocol</p>
                   <p className="text-sm font-bold truncate italic">{a.message}</p>
                </div>
                <Link to={a.link} className="shrink-0 px-4 py-2 bg-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Fix</Link>
             </div>
           ))}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
         <KpiCard 
           label="Active Leads" value={data.leads.active_leads} 
           sub={`${data.leads.leads_today > 0 ? '+' : ''}${data.leads.leads_today} today`} 
           color="text-blue-600" bg="bg-blue-50" icon={Users} 
           link="/leads"
         />
         <KpiCard 
           label="Collections" value={formatINR(data.revenue.collected_this_month)} 
           sub={`of ₹${formatINR(data.revenue.invoiced_this_month)} targets`} 
           color="text-emerald-600" bg="bg-emerald-50" icon={TrendingUp} 
           link="/invoices"
           progress={(data.revenue.collected_this_month / (data.revenue.invoiced_this_month || 1)) * 100}
         />
         <KpiCard 
           label="Outstanding" value={formatINR(data.revenue.outstanding)} 
           sub={`${data.overdueInvoices.overdue_invoices} node(s) overdue`} 
           color={data.revenue.outstanding > 0 ? "text-red-600" : "text-emerald-600"} 
           bg={data.revenue.outstanding > 0 ? "bg-red-50" : "bg-emerald-50"} 
           icon={AlertCircle} 
           link="/invoices?filter=overdue"
         />
         <KpiCard 
           label="Tasks Today" value={data.myTasks.my_tasks_today} 
           sub={`${data.myTasks.my_overdue_tasks} overdue blockers`} 
           color="text-amber-600" bg="bg-amber-50" icon={CheckSquare} 
           link="/tasks"
         />
      </div>

      {/* Two-Column Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
         {/* Left Column (Pipeline + Feed) */}
         <div className="lg:col-span-8 space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100">
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-8 px-2 flex items-center justify-between">
                  Inventory Flow Status
                  <span className="text-indigo-600">Sync: Realtime</span>
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                     {Object.entries(data.leads.status_counts).map(([status, count]) => (
                        <div key={status} className="group">
                           <div className="flex justify-between items-center mb-2 px-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 italic group-hover:text-slate-900 transition-colors">{status.replace('_', ' ')}</span>
                              <span className="text-[10px] font-black text-slate-900">{count}</span>
                           </div>
                           <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                              <div 
                                className={clsx(
                                  "h-full rounded-full transition-all duration-1000",
                                  status === 'converted' ? "bg-emerald-500" : status === 'lost' ? "bg-red-400" : "bg-indigo-600"
                                )} 
                                style={{ width: `${(count / data.leads.leads_this_month) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="flex flex-col justify-center items-center text-center p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                     <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Cycle Conversion Rate</p>
                     <h4 className="text-6xl font-black italic text-indigo-900 leading-none mb-4">
                        {Math.round((data.leads.converted_this_month / (data.leads.leads_this_month || 1)) * 100)}%
                     </h4>
                     <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest italic">Node processing efficiency</p>
                  </div>
               </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">High Intensity Entry Feed</h3>
                  <Link to="/leads" className="text-[8px] font-black uppercase text-indigo-600 hover:underline">Full Spectrum →</Link>
               </div>
               <div className="divide-y divide-slate-50">
                  {data.recentLeads.map(l => (
                    <Link key={l.id} to={`/leads/${l.id}`} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-all group">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-white group-hover:border-indigo-100 group-hover:text-indigo-600 border border-transparent transition-all">{l.customer_name.slice(0, 2).toUpperCase()}</div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-black italic uppercase text-slate-900 leading-none mb-1">{l.customer_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 italic">Project: {l.destination || 'Unmapped'}</p>
                       </div>
                       <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-50 text-slate-400 border border-slate-100">{l.status}</div>
                       <p className="text-[8px] font-bold text-slate-300 uppercase italic">{timeAgo(l.created_at)}</p>
                    </Link>
                  ))}
               </div>
            </section>
         </div>

         {/* Right Column (Ops + Tasks) */}
         <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-100">
               <div className="p-8 border-b border-slate-100 bg-indigo-50/20">
                  <h3 className="text-[10px] font-black uppercase text-indigo-900 tracking-[0.2em] flex items-center gap-2">
                     <Zap className="w-4 h-4 text-indigo-600" /> Operational Departures
                  </h3>
               </div>
               <div className="p-8 space-y-4">
                  {data.upcomingDepartures.length === 0 ? (
                    <div className="py-20 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-3xl">
                       <Plane className="w-10 h-10 text-slate-200 mx-auto" />
                       <p className="text-[10px] font-black uppercase text-slate-300 italic">No nodes departing this cycle.</p>
                    </div>
                  ) : (
                    data.upcomingDepartures.map(d => (
                       <Link key={d.id} to={`/bookings/${d.id}`} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg transition-all active:scale-[0.98]">
                          <div className={clsx(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white shrink-0",
                            new Date(d.travel_start_date).toDateString() === new Date().toDateString() ? "bg-red-500" : "bg-indigo-600"
                          )}>
                             <span className="text-lg font-black leading-none">{new Date(d.travel_start_date).getDate()}</span>
                             <span className="text-[8px] font-black uppercase tracking-tighter">{new Date(d.travel_start_date).toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[8px] font-black font-mono text-indigo-400 uppercase leading-none mb-1">{d.booking_number}</p>
                             <p className="text-[11px] font-black italic uppercase text-slate-900 truncate">{d.customer_name}</p>
                             <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic leading-none">{d.destination}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-200" />
                       </Link>
                    ))
                  )}
               </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-100">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                     <CheckSquare className="w-4 h-4" /> My Node Tasks
                  </h3>
                  <Link to="/tasks" className="text-[8px] font-black uppercase text-indigo-600 hover:underline">Full Sequence →</Link>
               </div>
               <div className="p-1 space-y-1">
                  {/* Task sub-render could happen here */}
                  <div className="p-8 text-center text-[10px] font-black uppercase text-slate-300 italic border-b border-slate-50 last:border-0 py-20">
                     Operational Tasks Optimized.
                  </div>
               </div>
            </section>
         </div>
      </div>

      {/* Revenue Trend Chart Section */}
      <section className="px-4 pb-12">
         <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
            <TrendingUp className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5 rotate-12" />
            <div className="flex justify-between items-end mb-12 relative z-10">
               <div>
                  <h3 className="text-3xl font-black italic uppercase leading-none mb-2 tracking-tighter">Collection Trajectory</h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">6 Month Financial Projection</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Cycle Aggregated Total</p>
                  <p className="text-3xl font-black italic leading-none">{formatINR(data.revenueTrend.reduce((s, p) => s + p.collected, 0))}</p>
               </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-4 px-4 relative z-10">
               {data.revenueTrend.map((p, i) => {
                  const maxCol = Math.max(...data.revenueTrend.map(r => r.collected)) || 1;
                  const height = (p.collected / maxCol) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                       <div className="relative w-full flex flex-col justify-end h-full">
                          <div 
                            className="bg-indigo-500 rounded-t-xl transition-all duration-1000 hover:bg-white group-hover:scale-x-105"
                            style={{ height: `${height}%` }}
                          >
                             <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic whitespace-nowrap shadow-2xl transition-all scale-75 group-hover:scale-100 pointer-events-none z-20">
                                {formatINR(p.collected)}
                             </div>
                          </div>
                       </div>
                       <span className="text-[10px] font-black uppercase text-white/40 group-hover:text-white transition-colors">{p.month}</span>
                    </div>
                  );
               })}
            </div>
         </div>
      </section>
    </div>
  );
};

const KpiCard = ({ label, value, sub, color, bg, icon: Icon, link, progress }: any) => (
  <Link to={link} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 group hover:-translate-y-2 transition-all hover:shadow-2xl">
     <div className="flex justify-between items-start mb-6">
        <div className={clsx("w-14 h-14 rounded-3xl flex items-center justify-center transition-all group-hover:rotate-12", bg)}><Icon className={clsx("w-7 h-7", color)} /></div>
        <ArrowRight className="w-4 h-4 text-slate-100 group-hover:text-indigo-400 transition-all" />
     </div>
     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">{label}</p>
     <h4 className={clsx("text-4xl font-black italic truncate leading-none mb-3", color === 'text-slate-900' ? 'text-slate-900' : color)}>{value}</h4>
     <p className="text-[9px] font-black uppercase text-slate-400 italic tracking-tighter opacity-70">{sub}</p>
     {progress !== undefined && (
        <div className="mt-4 h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-50">
           <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(100, progress)}%` }}></div>
        </div>
     )}
  </Link>
);

const EmptyDashboard = ({ agencyName }: { agencyName: string }) => (
  <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center text-center p-8">
     <div className="max-w-2xl bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-indigo-100 space-y-8 animate-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto"><Zap className="w-12 h-12 text-indigo-600 animate-pulse" /></div>
        <div className="space-y-4">
           <h2 className="text-4xl font-black italic uppercase text-slate-900 tracking-tighter">Initialize Command Module</h2>
           <p className="text-slate-500 font-medium italic leading-relaxed">
              Welcome to the Command Center of <span className="text-indigo-600 font-black">{agencyName}</span>. Your agency's performance telemetry will materialize here as you deploy Lead nodes and initiate Financial sequences.
           </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
           <Link to="/leads" className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
              <Plus className="w-4 h-4 text-indigo-400" /> Deploy First Lead Node
           </Link>
           <Link to="/settings" className="px-10 py-4 bg-slate-50 text-slate-400 font-black border border-slate-100 rounded-2xl text-[10px] uppercase italic tracking-widest hover:bg-slate-100 transition-all">
              Configure Agency Registry
           </Link>
        </div>
     </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4">
     <div className="flex justify-between items-end mb-12">
        <div className="space-y-3">
           <div className="h-10 w-96 bg-slate-100 rounded-2xl"></div>
           <div className="h-4 w-64 bg-slate-50 rounded-xl"></div>
        </div>
     </div>
     <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-56 bg-white border border-slate-100 rounded-[2.5rem]"></div>)}
     </div>
     <div className="grid grid-cols-12 gap-8 h-[500px]">
        <div className="col-span-8 bg-white border border-slate-100 rounded-[2.5rem]"></div>
        <div className="col-span-4 bg-white border border-slate-100 rounded-[2.5rem]"></div>
     </div>
  </div>
);
