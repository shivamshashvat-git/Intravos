import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Calendar,
  Share2,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Users
} from 'lucide-react';
import { useLeads } from '@/features/crm/hooks/useLeads';
import { CreateLeadDrawer } from '@/features/crm/components/CreateLeadDrawer';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { LeadStatus, LeadSource, LeadPriority } from '@/features/crm/types/lead';
import { leadsService } from '@/features/crm/services/leadsService';
import { format } from 'date-fns';
import { useAuth } from '@/core/hooks/useAuth';
import { supabase } from '@/core/lib/supabase';

export const LeadsPage: React.FC = () => {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const { 
    leads, 
    totalCount, 
    isLoading, 
    page, 
    setPage, 
    filters, 
    setFilters, 
    stats,
    addLeadOptimistically,
    updateLeadOptimistically,
    refreshLeads
  } = useLeads();

  const [users, setUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenant?.id) {
       supabase.from('users').select('id, name').eq('tenant_id', tenant.id).then(({ data }) => {
         if (data) {
           const userMap: Record<string, string> = {};
           data.forEach(u => userMap[u.id] = u.name);
           setUsers(userMap);
         }
       });
    }
  }, [tenant?.id]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters, setPage]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const originalLead = leads.find(l => l.id === leadId);
    if (!originalLead) return;

    updateLeadOptimistically(leadId, { status: newStatus });
    try {
      await leadsService.updateLead(leadId, { status: newStatus });
    } catch (error) {
      updateLeadOptimistically(leadId, { status: originalLead.status });
      showToast('Failed to update status', 'error');
    }
  };

  const handlePriorityChange = async (leadId: string, newPriority: LeadPriority) => {
    const originalLead = leads.find(l => l.id === leadId);
    if (!originalLead) return;

    updateLeadOptimistically(leadId, { priority: newPriority });
    try {
      await leadsService.updateLead(leadId, { priority: newPriority });
    } catch (error) {
      updateLeadOptimistically(leadId, { priority: originalLead.priority });
      showToast('Failed to update priority', 'error');
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    try {
      await leadsService.deleteLead(leadId);
      refreshLeads();
      showToast('Lead deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete lead', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const statusPills: (LeadStatus | 'all')[] = ['all', 'new', 'contacted', 'quote_sent', 'negotiating', 'converted', 'lost', 'on_hold'];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50 border-blue-100 ring-blue-500';
      case 'contacted': return 'text-yellow-600 bg-yellow-50 border-yellow-100 ring-yellow-500';
      case 'quote_sent': return 'text-orange-600 bg-orange-50 border-orange-100 ring-orange-500';
      case 'negotiating': return 'text-purple-600 bg-purple-50 border-purple-100 ring-purple-500';
      case 'converted': return 'text-green-600 bg-green-50 border-green-100 ring-green-500';
      case 'lost': return 'text-red-600 bg-red-50 border-red-100 ring-red-500';
      case 'on_hold': return 'text-slate-600 bg-slate-50 border-slate-100 ring-slate-400';
      default: return 'text-slate-400 bg-slate-50 ring-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right duration-300 flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-red-600 border-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <TrendingUp className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">LEADS</h1>
          <p className="text-slate-500 font-medium">Manage your agency's sales pipeline</p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Pipeline', value: stats.active, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Converted (MTD)', value: stats.convertedThisMonth, icon: Share2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Overdue Follow-ups', value: stats.overdueFollowups, icon: clock, color: 'text-red-600', bg: 'bg-red-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group hover:border-indigo-200 transition-colors">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
              {React.createElement(stat.icon, { className: "w-6 h-6" })}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {statusPills.map(s => (
            <button
              key={s}
              onClick={() => { setFilters({...filters, status: s}); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 ${
                (filters.status || 'all') === s 
                ? `${getStatusColor(s)} border-transparent ring-2` 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'All Leads' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
           {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, phone or destination..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Source Filter */}
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <select 
               className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-slate-600"
               value={filters.source || 'all'}
               onChange={(e) => { setFilters({...filters, source: e.target.value as any}); setPage(1); }}
             >
                <option value="all">Any Source</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="manual">Manual</option>
                <option value="website">Website</option>
                <option value="instagram">Instagram</option>
                <option value="agent">Agent</option>
                <option value="referral">Referral</option>
                <option value="network">Network</option>
                <option value="campaign">Campaign</option>
             </select>
          </div>

          {/* Priority Filter */}
          <div className="relative">
             <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <select 
               className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-slate-600"
               value={filters.priority || 'all'}
               onChange={(e) => { setFilters({...filters, priority: e.target.value as any}); setPage(1); }}
             >
                <option value="all">Any Priority</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
             </select>
          </div>

          {/* Clear Filters */}
          <button 
            onClick={() => { setSearchTerm(''); setFilters({}); setPage(1); }}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Destination</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Travel Date</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Source</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-center py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned</th>
                <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-10 bg-slate-100 rounded w-40"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
                    <td className="py-4 px-6 flex justify-center"><div className="h-6 bg-slate-100 rounded-full w-24"></div></td>
                    <td className="py-4 px-6"><div className="flex justify-center"><div className="h-6 bg-slate-100 rounded-full w-20"></div></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="py-4 px-6"><div className="flex justify-end gap-2"><div className="h-5 w-5 bg-slate-100 rounded"></div><div className="h-5 w-5 bg-slate-100 rounded"></div></div></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-slate-300" />
                       </div>
                       <p className="text-slate-500 font-bold mb-1">
                         {searchTerm || Object.keys(filters).length > 0 ? 'No leads match your filters' : 'No leads yet'}
                       </p>
                       <p className="text-sm text-slate-400 mb-6">
                         {searchTerm || Object.keys(filters).length > 0 ? 'Try searching for something else' : 'Add your first lead to get started'}
                       </p>
                       {searchTerm || Object.keys(filters).length > 0 ? (
                         <button onClick={() => {setSearchTerm(''); setFilters({});}} className="text-indigo-600 font-bold text-sm">Clear Filters</button>
                       ) : (
                         <button onClick={() => setIsDrawerOpen(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Add Lead</button>
                       )}
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{lead.customer_name}</span>
                        <span className="text-xs text-slate-400 font-medium">{lead.customer_phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-medium">{lead.destination || '—'}</td>
                    <td className="py-4 px-6 flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-slate-400" />
                       <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
                         {lead.travel_start_date ? format(new Date(lead.travel_start_date), 'dd MMM yyyy') : '—'}
                       </span>
                    </td>
                    <td className="py-4 px-6">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-0.5 rounded border border-slate-100 bg-slate-50">{lead.source}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <StatusBadge status={lead.status} onChange={(s) => handleStatusChange(lead.id, s)} />
                    </td>
                    <td className="py-4 px-6 text-center">
                       <PriorityBadge priority={lead.priority} onChange={(p) => handlePriorityChange(lead.id, p)} />
                    </td>
                    <td className="py-4 px-6">
                       <span className="text-xs text-slate-500 font-bold">{users[lead.assigned_to!] || '—'}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 25 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {(page - 1) * 25 + 1} - {Math.min(page * 25, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
               <button 
                 disabled={page === 1}
                 onClick={() => setPage(page - 1)}
                 className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-90"
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>
               <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-700">
                  {page}
               </div>
               <button 
                 disabled={page * 25 >= totalCount}
                 onClick={() => setPage(page + 1)}
                 className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-90"
               >
                 <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        )}
      </div>

      <CreateLeadDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={(lead) => {
          addLeadOptimistically(lead);
          showToast('Lead added successfully', 'success');
        }}
      />
    </div>
  );
};

const clock = Clock; // Icon name normalization
