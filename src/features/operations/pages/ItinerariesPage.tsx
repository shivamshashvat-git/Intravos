import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, MoreVertical, Eye, 
  MapPin, Calendar, Clock, ChevronRight, 
  FileText, Share2, Trash2, Layout, CheckCircle2,
  AlertCircle, Briefcase, Globe
} from 'lucide-react';
import { itinerariesService } from '@/features/operations/services/itinerariesService';
import { Itinerary, ItineraryStatus } from '@/features/operations/types/itinerary';
import { useAuth } from '@/core/hooks/useAuth';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';

export const ItinerariesPage: React.FC = () => {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItineraryStatus | 'all'>('all');

  useEffect(() => {
    fetchItineraries();
  }, [tenant?.id, statusFilter]);

  const fetchItineraries = async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const data = await itinerariesService.getItineraries(tenant.id, {
        status: statusFilter,
        search: search
      });
      setItineraries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!tenant?.id) return;
    const newItinerary = await itinerariesService.createItinerary({
      tenant_id: tenant.id,
      title: 'Untilted Operation Node',
      status: 'draft',
      total_days: 1
    });
    navigate(`/itineraries/${newItinerary.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Terminate this sequence master?')) return;
    await itinerariesService.deleteItinerary(id, tenant!.id);
    fetchItineraries();
  };

  const stats = {
    total: itineraries.length,
    shared: itineraries.filter(i => i.is_public).length,
    linked: itineraries.filter(i => i.booking_id).length
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Itinerary Control</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <Layout className="w-4 h-4 text-indigo-600" /> {stats.total} Master Sequences Active
          </p>
        </div>
        <button 
          onClick={handleCreate}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all uppercase italic text-xs"
        >
          <Plus className="w-4 h-4" /> Initialize New Blueprint
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
             <Layout className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Deployment Plans</p>
            <h3 className="text-3xl font-black text-slate-900 italic">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
             <Globe className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Client Portals</p>
            <h3 className="text-3xl font-black text-slate-900 italic text-emerald-600">{stats.shared}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-indigo-200 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-indigo-900 flex items-center justify-center text-indigo-400">
             <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-slate-400">Linked to Operations</p>
            <h3 className="text-3xl font-black text-slate-900 italic underline decoration-indigo-200 decoration-8 underline-offset-4">{stats.linked}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm tracking-tight"
            placeholder="Search by Title, Destination or Slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchItineraries()}
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto">
          {(['all', 'draft', 'ready', 'shared'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setStatusFilter(f)}
              className={clsx(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                statusFilter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 text-center italic text-slate-400 uppercase tracking-widest">Scanning Operation Logs...</div>
        ) : itineraries.length === 0 ? (
          <div className="p-32 text-center rounded-[2.5rem] border-4 border-dashed border-slate-50 m-6">
            <Layout className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">No Master blue prints</h3>
            <p className="text-sm font-bold text-slate-400 mt-2 italic px-20">You haven't initialized any trip sequences. Create your first strategic blueprint to start operations.</p>
            <button onClick={handleCreate} className="mt-10 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl italic flex items-center gap-2 mx-auto shadow-xl shadow-indigo-100 active:scale-95 transition-all text-xs uppercase tracking-widest">
              + Deploy First Node
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sequence Title</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Duration</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operational Link</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {itineraries.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <Link to={`/itineraries/${i.id}/edit`} className="block">
                          <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">{i.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase italic">Last Updated {timeAgo(i.updated_at || i.created_at)}</p>
                       </Link>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase">
                          <MapPin className="w-4 h-4 text-indigo-400" /> {i.destination || 'Global'}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-black italic">{i.total_days} DAYS</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-50">{i.start_date ? new Date(i.start_date).toLocaleDateString() : 'NO_START_DATE'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       {i.booking_id ? (
                          <Link to={`/bookings/${i.booking_id}`} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
                             BK NODE ACTIVE
                          </Link>
                       ) : (
                          <span className="text-[9px] font-bold text-slate-300 italic uppercase">Unlinked BP</span>
                       )}
                    </td>
                    <td className="px-8 py-6">
                       <span className={clsx(
                         "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                         i.status === 'shared' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                         i.status === 'ready' ? "bg-blue-50 text-blue-600 border-blue-100" :
                         "bg-slate-50 text-slate-400 border-slate-200"
                       )}>
                          {i.status}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/itineraries/${i.id}/edit`)} className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
                             <Layout className="w-4 h-4" />
                          </button>
                          {i.is_public && (
                             <button onClick={() => window.open(`/share/itinerary/${i.public_slug}`, '_blank')} className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">
                                <Globe className="w-4 h-4" />
                             </button>
                          )}
                          <button onClick={() => handleDelete(i.id)} className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
