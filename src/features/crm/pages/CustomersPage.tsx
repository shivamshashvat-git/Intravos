import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Edit2, Archive, Trash2, 
  ChevronLeft, ChevronRight, TrendingUp, Users, Building2, 
  Activity, Tag as TagIcon, MoreVertical
} from 'lucide-react';
import { useCustomers } from '@/features/crm/hooks/useCustomers';
import { CreateCustomerDrawer } from '@/features/crm/components/CreateCustomerDrawer';
import { customersService } from '@/features/crm/services/customersService';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { getAvatarColor, getInitials } from '@/utils/colors';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const { 
    customers, totalCount, isLoading, page, setPage, 
    filters, setFilters, stats, refreshCustomers, addCustomerOptimistically 
  } = useCustomers();

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters, setPage]);

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this customer? They will be hidden from this list.')) return;
    try {
      await customersService.archiveCustomer(id);
      refreshCustomers();
      showToast('Customer archived');
    } catch (e) {
      showToast('Action failed', 'error');
    }
  };

  const handleDelete = async (customer: any) => {
    if (customer.bookings_count > 0) {
      alert('Cannot delete a customer with existing bookings. Archive instead.');
      return;
    }
    if (!window.confirm('Delete this customer profile? This cannot be undone.')) return;
    try {
      await customersService.deleteCustomer(customer.id);
      refreshCustomers();
      showToast('Customer profile deleted');
    } catch (e) {
      showToast('Delete failed', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 italic font-black text-white text-xl ring-4 ring-indigo-50">IV</div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic flex items-center gap-2 uppercase">
                CUSTOMERS 
                <span className="text-xs font-bold not-italic bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100">{totalCount} Profiles</span>
              </h1>
              <p className="text-slate-500 font-medium">Your agency's primary client database</p>
           </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Total Database', value: stats.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Corporate Accounts', value: stats.corporate, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
           { label: 'Active (30D)', value: stats.activeThisMonth, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-6 group hover:border-indigo-200 transition-all shadow-sm">
             <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-8 h-8" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 leading-none">{stat.value}</h3>
             </div>
           </div>
         ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-6 items-center shadow-sm">
         <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 w-full md:w-72">
            {['all', 'individual', 'corporate'].map(t => (
              <button 
                key={t}
                onClick={() => setFilters({...filters, customer_type: t as any})}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filters.customer_type === t || (!filters.customer_type && t === 'all') ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t}
              </button>
            ))}
         </div>
         
         <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, phone, email or city..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="text-left py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Client Info</th>
                     <th className="text-left py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact</th>
                     <th className="text-left py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                     <th className="text-right py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Spent</th>
                     <th className="text-center py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Orders</th>
                     <th className="text-left py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tags</th>
                     <th className="text-right py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                         <td className="py-6 px-6"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded-full"></div><div className="h-4 bg-slate-100 w-32 rounded"></div></div></td>
                         <td className="py-6 px-6"><div className="h-3 bg-slate-100 w-24 rounded"></div></td>
                         <td className="py-6 px-6"><div className="h-6 bg-slate-100 w-20 rounded-full"></div></td>
                         <td className="py-6 px-6"><div className="h-4 bg-slate-100 w-20 rounded ml-auto"></div></td>
                         <td className="py-6 px-6"><div className="h-4 bg-slate-100 w-8 rounded mx-auto"></div></td>
                         <td className="py-6 px-6"><div className="h-4 bg-slate-100 w-24 rounded"></div></td>
                         <td className="py-6 px-6"><div className="h-5 bg-slate-100 w-16 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                         <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                               <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 italic mb-2">No Matching Profiles</h3>
                            <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium mb-8">Profiles are created from converted leads or added manually.</p>
                            <button onClick={() => setIsDrawerOpen(true)} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl italic">Create First Profile</button>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                         <td className="py-6 px-6">
                            <div className="flex items-center gap-4">
                               <div 
                                 className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white shadow-inner border-2 border-white"
                                 style={{ backgroundColor: getAvatarColor(c.name) }}
                               >
                                  {getInitials(c.name)}
                               </div>
                               <div>
                                  <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-none mb-1">{c.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.city || 'Location Unknown'}</p>
                               </div>
                            </div>
                         </td>
                         <td className="py-6 px-6">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-700">{c.phone || '—'}</span>
                               <span className="text-[10px] font-medium text-slate-400 lowercase">{c.email || 'no-email'}</span>
                            </div>
                         </td>
                         <td className="py-6 px-6">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.customer_type === 'corporate' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                               {c.customer_type}
                            </span>
                         </td>
                         <td className="py-6 px-6 text-right">
                            <span className="text-sm font-black text-slate-900 italic">{formatINR(c.total_spent || 0)}</span>
                         </td>
                         <td className="py-6 px-6 text-center">
                            <span className="text-xs font-bold text-slate-500">{c.bookings_count || 0}</span>
                         </td>
                         <td className="py-6 px-6">
                            <div className="flex gap-1">
                               {c.tags?.slice(0, 2).map((t, i) => (
                                 <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-tighter border border-slate-200">{t}</span>
                               ))}
                               {c.tags?.length > 2 && <span className="text-[10px] font-bold text-slate-300">+{c.tags.length - 2}</span>}
                            </div>
                         </td>
                         <td className="py-6 px-6 text-right">
                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}?edit=true`); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleArchive(c.id); }} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"><Archive className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(c); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"><Trash2 className="w-4 h-4" /></button>
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
           <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {customers.length} of {totalCount} Profiles</span>
              <div className="flex items-center gap-3">
                 <button disabled={page === 1} onClick={() => setPage(page-1)} className="p-2 border border-slate-200 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                 <span className="text-sm font-black text-slate-900 border-x border-slate-100 px-4">{page}</span>
                 <button disabled={page * 25 >= totalCount} onClick={() => setPage(page+1)} className="p-2 border border-slate-200 rounded-xl disabled:opacity-20 hover:bg-slate-50 transition-all"><ChevronRight className="w-5 h-5" /></button>
              </div>
           </div>
         )}
      </div>

      <CreateCustomerDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={(c) => {
          addCustomerOptimistically(c);
          showToast('Customer profile created');
        }} 
      />

      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
           <Activity className="w-4 h-4" />
           <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
