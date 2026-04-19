import React, { useState, useMemo } from 'react';
import { 
  Receipt, Plus, Search, Filter, Calendar, 
  Trash2, Edit3, MoreVertical, ExternalLink,
  ChevronRight, ArrowUpRight, DollarSign,
  Briefcase, CheckCircle, Clock, XCircle, Info,
  Tag, Paperclip, Building, User
} from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { Expense, ExpenseStatus, CreateExpenseInput } from '../types/expense';
import { format } from 'date-fns';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    expenses, categories, loading, filters, setFilters,
    recordExpense, updateExpense, deleteExpense, refresh 
  } = useExpenses();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const isAdmin = ['admin', 'agency_admin', 'super_admin'].includes(user?.role || '');

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + (parseFloat(e.amount as any) || 0), 0);
    const count = expenses.length;
    const pending = expenses.filter(e => e.status === 'pending').length;
    return { total, count, pending };
  }, [expenses]);

  const handleOpenDrawer = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    setDrawerOpen(true);
  };

  const statusMap: Record<ExpenseStatus, { color: string, icon: any, label: string }> = {
    pending: { color: 'text-amber-500 bg-amber-50 border-amber-100', icon: Clock, label: 'Pending' },
    approved: { color: 'text-emerald-500 bg-emerald-50 border-emerald-100', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'text-rose-500 bg-rose-50 border-rose-100', icon: XCircle, label: 'Rejected' },
    reimbursed: { color: 'text-indigo-500 bg-indigo-50 border-indigo-100', icon: DollarSign, label: 'Reimbursed' }
  };

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-40 px-6">
      {/* Header section with rich aesthetics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-7xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">Expenses</h1>
            <div className="bg-slate-100 text-slate-400 px-6 py-2 rounded-full text-sm font-black italic shadow-inner border border-slate-200/50">
              {expenses.length} NODES
            </div>
          </div>
          <p className="text-slate-400 font-bold italic uppercase tracking-[0.2em] text-[10px] mt-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-500" /> Track operational burn and reimbursable overheads
          </p>
        </div>
        
        <button 
          onClick={() => handleOpenDrawer()}
          className="group px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] text-xs font-black uppercase italic tracking-widest shadow-2xl shadow-rose-200/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border-b-4 border-rose-500 hover:border-emerald-400"
        >
          <Plus className="w-5 h-5 text-rose-500 group-hover:text-emerald-400 group-hover:rotate-90 transition-all" /> 
          Record Outflow Node
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatNode label="Total Outflow" value={formatINR(stats.total)} sub="Aggregated burn in current flux" icon={ArrowUpRight} variant="dark" />
        <StatNode label="Pending Approval" value={stats.pending} sub="Nodes awaiting governance sign-off" icon={Clock} variant="warning" />
        <StatNode label="Categories Active" value={categories.length} sub="Thematic distribution of costs" icon={Tag} variant="info" />
      </div>

      {/* Filters bar */}
      <div className="bg-white/50 backdrop-blur-xl border border-slate-200/60 p-4 rounded-[2rem] shadow-xl shadow-slate-100/50 flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-all" />
          <input 
            type="text" 
            placeholder="SEARCH BY VENDOR, DESCRIPTION OR AMOUNT..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase italic focus:bg-white focus:border-rose-200 transition-all"
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select 
            className="flex-1 lg:w-48 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase italic"
            value={filters.category_id}
            onChange={e => setFilters({...filters, category_id: e.target.value})}
          >
            <option value="">ALL CATEGORIES</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
          </select>

          <select 
            className="flex-1 lg:w-48 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase italic"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="">ALL STATUS</option>
            <option value="pending">PENDING</option>
            <option value="approved">APPROVED</option>
            <option value="rejected">REJECTED</option>
            <option value="reimbursed">REIMBURSED</option>
          </select>
          
          <button className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-6">
        {loading && expenses.length === 0 ? (
          <div className="py-40 text-center font-black italic uppercase text-slate-200 text-xl animate-pulse tracking-[0.3em]">
            Synchronizing Outflow Stream...
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 py-32 rounded-[4rem] text-center space-y-8 italic">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto">
                <Receipt className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">No Outflow Nodes Detected</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-sm mx-auto">Current financial frequency is clear of operational burn signatures.</p>
              </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {expenses.map(expense => (
              <div 
                key={expense.id}
                className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-rose-100/50 transition-all flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
              >
                {/* Visual indicator based on status */}
                <div className={clsx("absolute left-0 top-0 bottom-0 w-2", (statusMap[expense.status] || statusMap.pending).color.split(' ')[0].replace('text', 'bg'))} />
                
                {/* Category Icon */}
                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:scale-110 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all duration-500">
                  <Briefcase className="w-8 h-8" />
                </div>

                {/* Main Identity */}
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <span className="text-[10px] font-black uppercase italic px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200/50">
                      {expense.category?.name || 'Uncategorized'}
                    </span>
                    <span className={clsx("text-[9px] font-black uppercase italic px-4 py-1.5 rounded-full border flex items-center gap-2", (statusMap[expense.status] || statusMap.pending).color)}>
                      {React.createElement((statusMap[expense.status] || statusMap.pending).icon, { className: 'w-3 h-3' })}
                      {(statusMap[expense.status] || statusMap.pending).label}
                    </span>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-950 line-clamp-1 italic">{expense.description}</h3>
                  <div className="flex items-center gap-6 justify-center md:justify-start text-slate-400">
                    <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 italic">
                       <Calendar className="w-3.5 h-3.5 text-rose-400" /> {format(new Date(expense.expense_date), 'dd MMM yyyy')}
                    </p>
                    {expense.vendor && (
                      <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 italic">
                         <Building className="w-3.5 h-3.5 text-indigo-400" /> {expense.vendor}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount Section */}
                <div className="px-10 text-center md:text-right border-x border-slate-50 h-full flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 italic">Resolution Amount</p>
                  <h4 className="text-3xl font-black italic tracking-tighter text-slate-950 whitespace-nowrap">{formatINR(expense.amount)}</h4>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                   {expense.receipt_url && (
                     <a 
                       href={expense.receipt_url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg"
                     >
                       <Paperclip className="w-5 h-5" />
                     </a>
                   )}
                   <button 
                     onClick={() => handleOpenDrawer(expense)}
                     className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-500 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg"
                   >
                     <Edit3 className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => {
                       if (window.confirm('Delete this outflow node record?')) deleteExpense(expense.id);
                     }}
                     className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rich Drawer for Creating/Editing */}
      <ExpenseDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        expense={editingExpense}
        categories={categories}
        onSubmit={async (data) => {
          if (editingExpense) await updateExpense(editingExpense.id, data);
          else await recordExpense(data);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
};

const StatNode = ({ label, value, sub, icon: Icon, variant = 'default' }: any) => {
  const themes = {
    dark: 'bg-slate-950 text-white border-white/5',
    warning: 'bg-amber-50 text-amber-950 border-amber-100',
    info: 'bg-indigo-50 text-indigo-950 border-indigo-100'
  } as any;

  return (
    <div className={clsx(
      "p-10 rounded-[3.5rem] border shadow-2xl shadow-slate-200/50 flex flex-col justify-between group hover:-translate-y-2 transition-all relative overflow-hidden",
      themes[variant]
    )}>
       <div className={clsx(
         "w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:rotate-12",
         variant === 'dark' ? "bg-white/10" : "bg-white shadow-xl shadow-black/5 text-slate-950"
       )}>
          <Icon className="w-6 h-6" />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2 italic">[{label}]</p>
          <h4 className="text-3xl font-black italic tracking-tighter leading-none">{value}</h4>
          <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest mt-4 leading-relaxed">{sub}</p>
       </div>
    </div>
  );
};

const ExpenseDrawer = ({ isOpen, onClose, expense, categories, onSubmit }: any) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category_id: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    status: 'pending',
    receipt_url: ''
  });

  React.useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: String(expense.amount || ''),
        category_id: expense.category_id || '',
        expense_date: expense.expense_date ? format(new Date(expense.expense_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        vendor: expense.vendor || '',
        status: expense.status || 'pending',
        receipt_url: expense.receipt_url || ''
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        category_id: categories[0]?.id || '',
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        vendor: '',
        status: 'pending',
        receipt_url: ''
      });
    }
  }, [expense, categories, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[4rem]">
        {/* Header */}
        <div className="p-12 pb-8 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-950 mb-2">
              {expense ? 'Modify Node' : 'Initialize Outflow'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Compliance & Regulatory Overhead Tracking</p>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-950 rounded-3xl transition-all">
            <MoreVertical className="w-6 h-6 rotate-90" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identity & Purpose*</label>
              <textarea 
                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black italic uppercase focus:bg-white focus:border-rose-200 transition-all min-h-[120px]"
                placeholder="E.G. OFFICE RENT - APRIL 2024 / CLIENT SITE VISIT..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})}
              />
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valuation ₹*</label>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="number" 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xl font-black italic focus:bg-white"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Node Date*</label>
                <input 
                   type="date" 
                   className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black uppercase"
                   value={formData.expense_date}
                   onChange={e => setFormData({...formData, expense_date: e.target.value})}
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Domain Classification</label>
                <select 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase italic"
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">SELECT CATEGORY</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mapping Status</label>
                <select 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase italic"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="pending">PENDING</option>
                  <option value="approved">APPROVED</option>
                  <option value="rejected">REJECTED</option>
                  <option value="reimbursed">REIMBURSED</option>
                </select>
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Vendor / Counterparty Trace</label>
              <div className="relative group">
                <Building className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500" />
                <input 
                  type="text" 
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase italic focus:bg-white"
                  placeholder="IDENTITY OF THE RECIPIENT..."
                  value={formData.vendor}
                  onChange={e => setFormData({...formData, vendor: e.target.value.toUpperCase()})}
                />
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 italic text-rose-400 flex items-center gap-2">
                 <Paperclip className="w-3.5 h-3.5" /> Documentary Evidence (URL)
              </label>
              <input 
                type="text" 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-400 italic"
                placeholder="HTTPS://RECEIPT-STORAGE.S3.AMAZON..."
                value={formData.receipt_url}
                onChange={e => setFormData({...formData, receipt_url: e.target.value})}
              />
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-10 border-t border-slate-50 bg-slate-50/50 rounded-bl-[4rem] flex flex-col gap-4">
           <button 
             onClick={() => onSubmit({...formData, amount: parseFloat(formData.amount) || 0})}
             className="w-full py-6 bg-slate-950 text-white rounded-3xl text-sm font-black uppercase italic tracking-[0.2em] shadow-2xl hover:bg-black transition-all border-b-4 border-rose-500"
           >
             Commit Node to Ledger
           </button>
           <button 
             onClick={onClose}
             className="w-full py-4 text-[10px] font-black uppercase text-slate-400 italic tracking-widest hover:text-slate-900 transition-all"
           >
             Abort Operation
           </button>
        </div>
      </div>
    </div>
  );
};
