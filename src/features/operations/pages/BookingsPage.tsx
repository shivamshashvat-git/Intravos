import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Calendar, Users, MapPin, 
  Clock, AlertTriangle, CheckCircle, XCircle, 
  MoreVertical, Eye, Map, Plane, Compass, Flag 
} from 'lucide-react';
import { useBookings } from '../hooks/useBookings';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';
import { BookingStatus, BookingPriority } from '../types/booking';

export const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    bookings, isLoading, filters, setFilters, 
    stats, refresh 
  } = useBookings();

  const statusTabs: { id: BookingStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'Fleet Node' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'in_progress', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'on_hold', label: 'Suspended' },
  ];

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end px-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none underline decoration-indigo-200 decoration-8 underline-offset-[10px]">Operations Log</h1>
            <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black italic mt-1">{bookings.length}</span>
          </div>
          <p className="text-slate-400 font-bold italic lowercase pl-1">Executing travel protocols and logistics</p>
        </div>
        <button onClick={() => navigate('/bookings/new')} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic tracking-widest shadow-xl flex items-center gap-2 hover:-translate-y-1 transition-all">
          <Plus className="w-4 h-4 text-emerald-400" /> Initialize Mission
        </button>
      </div>

      {/* Departing Today Alert */}
      {stats.departingToday > 0 && (
        <div className="mx-4 bg-rose-600 text-white p-4 rounded-2xl shadow-xl shadow-rose-100 flex items-center justify-between animate-pulse">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                 <Flag className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs font-black uppercase tracking-widest">Immediate Priority</p>
                 <p className="text-sm font-black italic">{stats.departingToday} Mission(s) commencing today</p>
              </div>
           </div>
           <button className="px-6 py-2 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase italic shadow-lg">View Deployments →</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        <StatCard label="Active Fleet" value={stats.active} icon={Compass} color="text-slate-900" bg="bg-slate-100" />
        <StatCard label="Deployments (Wk)" value={stats.departingThisWeek} icon={Plane} color="text-amber-600" bg="bg-amber-50" highlight={stats.departingThisWeek > 0} />
        <StatCard label="Completed (Mo)" value={stats.completedMonth} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Terminated (Mo)" value={stats.cancelledMonth} icon={XCircle} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-100/50 space-y-8 mx-4">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 items-center overflow-x-auto no-scrollbar">
            {statusTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilters({ ...filters, status: tab.id })}
                className={clsx(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all whitespace-nowrap border border-transparent",
                  filters.status === tab.id ? "bg-white text-slate-900 shadow-sm border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 max-w-xl w-full">
            <div className="relative group flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH BK #, CUSTOMER, MISSION..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase italic focus:bg-white focus:border-indigo-200 transition-all"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Log Node</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Protocol Identity</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Chrono Frame</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status NODE</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Priority</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Value Node</th>
                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : 
                bookings.length === 0 ? <EmptyState /> :
                bookings.map(bk => (
                <tr key={bk.id} className={clsx(
                  "hover:bg-slate-50/50 transition-all group",
                  bk.travel_date_start === today && "bg-rose-50/30"
                )}>
                  <td className="py-6 px-6">
                    <p className="text-[10px] font-mono font-black text-indigo-600 mb-0.5">{bk.booking_number}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">Mission Core Connected</p>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <p className="text-sm font-black uppercase text-slate-900 leading-none mb-1">{bk.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight italic flex items-center justify-center gap-1.5 uppercase">
                       <MapPin className="w-3 h-3" /> {bk.destination} • {bk.customer?.name}
                    </p>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <div className="inline-flex flex-col items-center">
                       <p className="text-[10px] font-black text-slate-900 mb-1">{new Date(bk.travel_date_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(bk.travel_date_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                       <DepartureStatus travelDate={bk.travel_date_start} />
                    </div>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <StatusBadge status={bk.status} />
                  </td>
                  <td className="py-6 px-6 text-center">
                    <PriorityBadge priority={bk.priority} />
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="space-y-1">
                       <p className="text-xs font-black text-slate-900">{formatINR(bk.selling_price)}</p>
                       <p className={clsx("text-[9px] font-black italic", bk.amount_outstanding > 0 ? "text-rose-600" : "text-emerald-500")}>Outstanding: {formatINR(bk.amount_outstanding)}</p>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/bookings/${bk.id}`} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all shadow-sm"><Eye className="w-4 h-4" /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg, highlight }: any) => (
  <div className={clsx(
    "bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 group hover:shadow-indigo-50/30 transition-all overflow-hidden relative",
    highlight && "ring-2 ring-amber-500 ring-offset-4"
  )}>
    <div className="flex justify-between items-start mb-6">
      <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12", bg)}>
        <Icon className={clsx("w-6 h-6", color)} />
      </div>
    </div>
    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 leading-none">{label}</p>
    <h4 className={clsx("text-xl font-black italic tracking-tighter leading-none whitespace-nowrap", color)}>{value}</h4>
  </div>
);

const DepartureStatus = ({ travelDate }: { travelDate: string }) => {
  const diff = Math.ceil((new Date(travelDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  if (diff === 0) return <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase animate-pulse">Commencing Today</span>;
  if (diff > 0 && diff <= 7) return <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase italic">In {diff} Days</span>;
  if (diff < 0) return <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-400 border border-indigo-100 uppercase italic">Active Node</span>;
  return <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-50 text-slate-300 uppercase italic tracking-widest">Scheduled</span>;
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const map: Record<BookingStatus, { bg: string, text: string, label: string }> = {
    confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Confirmed' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Mission' },
    completed: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Resolved' },
    cancelled: { bg: 'bg-rose-100', text: 'text-rose-600', label: 'Terminated' },
    on_hold: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'On Hold' }
  };
  const theme = map[status] || map.confirmed;
  return (
    <span className={clsx("px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-wider whitespace-nowrap", theme.bg, theme.text)}>
      {theme.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: BookingPriority }) => {
  const map: Record<BookingPriority, string> = {
    urgent: 'bg-rose-500 text-white',
    high: 'bg-amber-500 text-white shadow-lg shadow-amber-100',
    normal: 'bg-slate-100 text-slate-400',
    low: 'bg-blue-100 text-blue-400'
  };
  return (
    <span className={clsx("px-2 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest", map[priority])}>
      {priority}
    </span>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td colSpan={7} className="py-8 px-6 bg-slate-50/20 rounded-2xl mb-2"></td>
  </tr>
);

const EmptyState = () => (
    <tr>
      <td colSpan={10} className="py-24 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Map className="w-8 h-8 text-slate-200" />
        </div>
        <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-[0.2em]">Operations Fleet Empty. Deploy Missions to Populate.</p>
        <Link to="/bookings/new" className="text-[10px] font-black uppercase text-indigo-600 mt-4 inline-block hover:underline underline-offset-8">Initialize Mission Node →</Link>
      </td>
    </tr>
);
