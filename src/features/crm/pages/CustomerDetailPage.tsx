import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Phone, Mail, MapPin, Calendar, Users, 
  CreditCard, FileText, CheckCircle2, AlertCircle, Edit3, 
  Trash2, Archive, MoreVertical, Plus, Plane, Hotel, Utensils,
  Eye, EyeOff, Lock, Hash, Save, X, Globe, User, History, Info, ChevronRight, Building2, Wallet,
  Clock, Activity, Timer
} from 'lucide-react';
import { useCustomerDetail } from '@/features/crm/hooks/useCustomerDetail';
import { customersService } from '@/features/crm/services/customersService';
import { quotationsService } from '@/features/finance/services/quotationsService';
import { invoicesService } from '@/features/finance/services/invoicesService';
import { bookingsService } from '@/features/operations/services/bookingsService';
import { Quotation } from '@/features/finance/types/quotation';
import { Invoice, PaymentTransaction } from '@/features/finance/types/invoice';
import { Booking } from '@/features/operations/types/booking';
import { PaymentDrawer } from '@/features/finance/components/PaymentDrawer';
import { useAuth } from '@/core/hooks/useAuth';
import { EditCustomerDrawer } from '@/features/crm/components/EditCustomerDrawer';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { getAvatarColor, getInitials } from '@/utils/colors';
import { maskPassport, maskAadhar, maskPAN } from '@/utils/mask';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CreateBookingDrawer } from '@/features/operations/components/CreateBookingDrawer';
import { DocumentsTab } from '@/shared/components/DocumentsTab';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

type TabType = 'overview' | 'travelers' | 'identity' | 'preferences' | 'documents';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const { customer, travelers, leads, quotations: _q_unused, invoices: _i_unused, isLoading, error, refreshCustomer, setCustomer } = useCustomerDetail(id!);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [maskState, setMaskState] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    const fetchRelatedFinance = async () => {
      if (!id || !tenant?.id) return;
      try {
        const [qRes, iRes, bRes] = await Promise.all([
           quotationsService.getQuotations(tenant.id, { customer_id: id }),
           invoicesService.getInvoices(tenant.id, { customer_id: id } as any),
           bookingsService.getBookings(tenant.id, { customer_id: id } as any)
        ]);
        setQuotations(qRes);
        setInvoices(iRes);
        setBookings(bRes);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRelatedFinance();
  }, [id, tenant?.id]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInlineSave = async (field: keyof any, value: any) => {
    if (!customer) return;
    try {
      const updated = await customersService.updateCustomer(customer.id, { [field]: value });
      setCustomer(updated);
      setEditingField(null);
      showToast('Preference Updated');
    } catch (e) {
      showToast('Save Failed', 'error');
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center italic text-slate-400">Syncing Master Record...</div>;
  if (error || !customer) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <AlertCircle className="w-16 h-16 text-slate-200 mb-6" />
        <h2 className="text-3xl font-black text-slate-900 italic mb-4 uppercase">Profile Not Found</h2>
        <Link to="/customers" className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2">
           <ChevronLeft className="w-4 h-4" /> Return to Database
        </Link>
      </div>
    );
  }

  const outstandingBalance = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((a, b) => a + (b.amount_outstanding || 0), 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <Link to="/customers" className="hover:text-indigo-600 transition-colors">Database</Link>
        <span>/</span>
        <span className="text-slate-950">{customer.name}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center gap-8">
         <div 
           className="w-24 h-24 rounded-[1.5rem] shrink-0 flex items-center justify-center text-3xl font-black text-white shadow-2xl relative"
           style={{ backgroundColor: getAvatarColor(customer.name) }}
         >
            {getInitials(customer.name)}
            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-100">
               {customer.customer_type === 'corporate' ? <Building2 className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-blue-600" />}
            </div>
         </div>
         
         <div className="flex-1 space-y-4">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{customer.name}</h1>
               <div className="flex flex-wrap items-center gap-6 mt-2">
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600">
                    <Phone className="w-4 h-4" /> {customer.phone || 'No Phone'}
                  </a>
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 border-l border-slate-200 pl-6">
                    <Mail className="w-4 h-4" /> {customer.email || 'No Email'}
                  </a>
               </div>
            </div>

            <div className="flex flex-wrap gap-2">
               {customer.tags?.map(t => (
                 <span key={t} className="px-3 py-1 bg-slate-50 text-slate-400 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest">{t}</span>
               ))}
               {(!customer.tags || customer.tags.length === 0) && <span className="text-[10px] font-bold text-slate-300 italic">No segment tags</span>}
            </div>
         </div>

         <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lifetime Value</p>
               <h3 className="text-3xl font-black text-emerald-600 italic tracking-tighter">{formatINR(customer.lifetime_value || 0)}</h3>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setIsEditDrawerOpen(true)} className="px-6 py-2 bg-indigo-600 text-white font-black rounded-xl italic flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100 uppercase text-xs">
                 Edit Profile
               </button>
               <button className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                 <MoreVertical className="w-5 h-5" />
               </button>
            </div>
         </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
         {(['overview', 'travelers', 'identity', 'preferences', 'documents'] as TabType[]).map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={cn(
               "px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative border-b-2",
               activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
             )}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
         {activeTab === 'overview' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Activity Hub */}
              <div className="lg:col-span-8 space-y-8">
                 {/* Invoices Section */}
                 <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Invoices & Collections</h3>
                       <Link to={`/invoices?customer_id=${customer.id}`} className="text-[10px] font-black uppercase text-emerald-600">All Bills</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {invoices.length === 0 ? (
                         <div className="p-10 text-center bg-slate-50/10">
                            <Clock className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 italic">No billings recorded for this client.</p>
                         </div>
                       ) : (
                         invoices.slice(0, 5).map(inv => (
                            <div key={inv.id} className="p-5 hover:bg-slate-50 transition-colors group flex items-center justify-between">
                               <Link to={`/invoices/${inv.id}`} className="flex items-center gap-4 flex-1">
                                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                                     <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-slate-900 mb-0.5">{inv.invoice_number}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase italic">{new Date(inv.invoice_date).toLocaleDateString()} • {inv.status}</p>
                                  </div>
                               </Link>
                               <div className="text-right flex items-center gap-6">
                                  <div>
                                     <p className="text-sm font-black italic">{formatINR(inv.total_amount)}</p>
                                     {inv.amount_outstanding > 0 ? (
                                       <p className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">O: {formatINR(inv.amount_outstanding)}</p>
                                     ) : (
                                       <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter italic">Settled</p>
                                     )}
                                  </div>
                                  {inv.amount_outstanding > 0 && (
                                    <button 
                                      onClick={() => { setSelectedInvoice(inv); setIsPaymentDrawerOpen(true); }}
                                      className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                                    >
                                       <Wallet className="w-4 h-4" />
                                    </button>
                                  )}
                               </div>
                            </div>
                         ))
                       )}
                    </div>
                 </div>

                 {/* Confirmed Bookings */}
                 <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                     <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600" /> Operational Fleet</h3>
                        <div className="flex gap-4">
                           <Link to={`/bookings?customer_id=${customer.id}`} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600">All Ops</Link>
                           <button onClick={() => setIsBookingDrawerOpen(true)} className="text-[10px] font-black uppercase text-indigo-600">+ Initialize</button>
                        </div>
                     </div>
                    <div className="divide-y divide-slate-50">
                       {bookings.length === 0 ? (
                         <div className="p-10 text-center bg-slate-50/10 border-b border-slate-100 border-dashed">
                            <p className="text-[10px] font-bold text-slate-400 italic">No historical operational data.</p>
                         </div>
                       ) : (
                         bookings.map(b => (
                           <Link key={b.id} to={`/bookings/${b.id}`} className="block p-5 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="text-xs font-black text-slate-900 tracking-tight italic uppercase">{b.booking_number} • {b.destination}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{new Date(b.travel_date_start!).toDateString()}</p>
                                 </div>
                                 <span className={clsx(
                                   "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                   b.status === 'confirmed' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                                 )}>{b.status}</span>
                              </div>
                           </Link>
                         ))
                       )}
                    </div>
                 </div>

                 {/* Leads Section */}
                 <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Trip History & Leads</h3>
                       <Link to="/leads?search=" className="text-[10px] font-black uppercase text-indigo-600">View All Leads</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {leads.length === 0 ? (
                         <p className="p-12 text-center text-xs font-bold text-slate-400 italic">No trip history recorded yet.</p>
                       ) : (
                         leads.slice(0, 5).map(l => (
                           <Link key={l.id} to={`/leads/${l.id}`} className="block p-5 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                                       <Plane className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-900">{l.destination || 'Unspecified Trip'}</p>
                                       <p className="text-[10px] font-medium text-slate-400">{l.travel_start_date ? new Date(l.travel_start_date).toDateString() : 'Date Pending'}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="text-xs font-black italic">{l.selling_price ? formatINR(l.selling_price) : 'No Quote'}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-500">{l.status}</span>
                                 </div>
                              </div>
                           </Link>
                         ))
                       )}
                    </div>
                 </div>

                 {/* Quotations Section */}
                 <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Quotations</h3>
                       <Link to={`/quotations?customer_id=${customer.id}`} className="text-[10px] font-black uppercase text-indigo-600">View All</Link>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {quotations.length === 0 ? (
                         <div className="p-12 text-center bg-slate-50/20">
                            <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-xs font-bold text-slate-400 italic">No proposals generated yet.</p>
                         </div>
                       ) : (
                         quotations.slice(0, 5).map(q => (
                           <Link key={q.id} to={`/quotations/${q.id}`} className="block p-5 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                                       <FileText className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-900">{q.quote_number}</p>
                                       <p className="text-[10px] font-medium text-slate-400">{q.destination || 'Custom Tour'}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="text-xs font-black italic">{formatINR(q.total_amount)}</span>
                                    <span className={clsx(
                                       "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-500",
                                       q.status === 'accepted' && "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>{q.status}</span>
                                 </div>
                              </div>
                           </Link>
                         ))
                       )}
                    </div>
                 </div>
              </div>

              {/* Right Column: Financial Panel */}
              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">Commercials</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
                          <span className="text-sm font-black text-slate-900">{formatINR(customer.total_spent || 0)}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase">Total Bookings</span>
                          <span className="text-sm font-black text-slate-900">{customer.bookings_count || 0}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase">Outstanding</span>
                          <span className={cn("text-sm font-black italic underline underline-offset-4 decoration-2", outstandingBalance > 0 ? "text-red-600" : "text-emerald-600")}>
                             {outstandingBalance > 0 ? formatINR(outstandingBalance) : 'Fully Clear'}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                    <Activity className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Important Dates</h3>
                    {(!customer.important_dates || customer.important_dates.length === 0) ? (
                      <p className="text-xs font-bold opacity-50 italic">No dates added</p>
                    ) : (
                      <div className="space-y-4 relative z-10">
                        {customer.important_dates.map((d, i) => (
                          <div key={i} className="flex justify-between items-center bg-white/10 p-2 rounded-xl border border-white/10">
                             <div className="flex items-center gap-2">
                                <span className="text-lg">{d.type === 'birthday' ? '🎂' : d.type === 'anniversary' ? '💍' : '📅'}</span>
                                <span className="text-xs font-bold">{d.label}</span>
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest bg-white text-indigo-600 px-2 py-0.5 rounded-full">
                                {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                             </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setIsEditDrawerOpen(true)} className="w-full mt-6 py-2 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all">Manage Dates</button>
                 </div>

                 {/* Address Info */}
                 <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Contact Address</h3>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{customer.address || 'Address not stored.'}</p>
                    <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">City</p>
                          <p className="text-xs font-black italic">{customer.city || '—'}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">State</p>
                          <p className="text-xs font-black italic">{customer.state || '—'}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Country</p>
                          <p className="text-xs font-black italic">{customer.country || 'India'}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'travelers' && (
           <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xl font-bold text-slate-900 italic uppercase tracking-tight">Family & Associated Travelers</h2>
                 <button className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" /> Add Traveler
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {travelers.length === 0 ? (
                   <div className="col-span-full py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-sm font-bold text-slate-400 italic">No associated travelers yet.</p>
                   </div>
                 ) : (
                   travelers.map(t => (
                     <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 uppercase italic">
                              {getInitials(t.name)}
                           </div>
                           <div>
                              <p className="font-black text-slate-900 uppercase italic">{t.name}</p>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100">{t.relationship}</span>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-400">DOB</span>
                              <span className="text-slate-700">{t.date_of_birth || 'Not Recorded'}</span>
                           </div>
                           <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-400">Passport</span>
                              <span className="text-slate-700 italic">{maskPassport(t.passport_number)}</span>
                           </div>
                           <div className="flex justify-between text-xs font-bold items-center py-2 border-t border-slate-50 mt-4">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passport Expiry</span>
                               <span className={cn(
                                 "text-[10px] font-black px-2 py-0.5 rounded-full border shadow-sm",
                                 t.passport_expiry && new Date(t.passport_expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                               )}>
                                  {t.passport_expiry || 'Unknown'}
                               </span>
                           </div>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
         )}

         {activeTab === 'identity' && (
           <div className="animate-in fade-in duration-300 max-w-4xl">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 italic uppercase">Identity & Compliance Vault</h2>
                    <p className="text-xs font-bold text-slate-400 italic">Sensitive documents are encrypted and masked for security.</p>
                 </div>
                 <button 
                   onClick={() => setMaskState(!maskState)}
                   className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                 >
                    {maskState ? <><Eye className="w-4 h-4" /> Unmask Values</> : <><EyeOff className="w-4 h-4" /> Mask Values</>}
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                 {[
                   { label: 'Passport Number', value: customer.passport_number, masked: maskPassport(customer.passport_number), icon: Globe, status: 'Active' },
                   { label: 'Passport Expiry', value: customer.passport_expiry, masked: customer.passport_expiry, icon: Calendar, warn: (customer.passport_expiry && new Date(customer.passport_expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) },
                   { label: 'PAN Number', value: customer.pan_number, masked: maskPAN(customer.pan_number), icon: Hash },
                   { label: 'Aadhar Number', value: customer.aadhar_number, masked: maskAadhar(customer.aadhar_number), icon: Lock },
                   { label: 'GST Number', value: customer.gst_number, masked: customer.gst_number, icon: Building2, full: true }
                 ].map((doc, idx) => (
                   <div key={idx} className={cn("bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-6", doc.full && "md:col-span-2")}>
                      <div className="p-4 bg-slate-50 text-slate-300 rounded-2xl group-hover:text-indigo-600 transition-colors">
                         <doc.icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{doc.label}</span>
                         <span className={cn(
                           "text-xl font-black italic", 
                           maskState ? "text-slate-400" : "text-slate-900",
                           doc.warn && "text-red-600"
                         )}>
                           {maskState ? doc.masked : (doc.value || 'NOT_RECORDED')}
                         </span>
                      </div>
                      {doc.warn && <div className="px-3 py-1 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase rounded-lg">Update Required</div>}
                   </div>
                 ))}
              </div>
           </div>
         )}

         {activeTab === 'preferences' && (
           <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-2 gap-8 pb-40">
              <div className="space-y-6">
                 <h2 className="text-xl font-bold text-slate-900 italic uppercase mb-2">Travel Preferences</h2>
                 {[
                   { label: 'Preferred Destinations', field: 'preferred_destinations', icon: Globe, value: customer.preferred_destinations },
                   { label: 'Preferred Airlines', field: 'preferred_airlines', icon: Plane, value: customer.preferred_airlines },
                   { label: 'Dietary Preferences', field: 'dietary_preferences', icon: Utensils, value: customer.dietary_preferences },
                   { label: 'Special Needs', field: 'special_needs', icon: Info, value: customer.special_needs },
                 ].map(pref => (
                   <div key={pref.field} className="bg-white p-6 rounded-3xl border border-slate-200 group">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <pref.icon className="w-5 h-5 text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pref.label}</span>
                         </div>
                         {editingField !== pref.field && (
                           <button onClick={() => { setEditingField(pref.field); setTempValue(pref.value || ''); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                         )}
                      </div>
                      
                      {editingField === pref.field ? (
                         <div className="space-y-3">
                            <textarea 
                              autoFocus
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 text-sm font-medium"
                              value={tempValue}
                              onChange={e => setTempValue(e.target.value)}
                              onKeyDown={e => {
                                 if (e.key === 'Enter' && !e.shiftKey) handleInlineSave(pref.field as any, tempValue);
                                 if (e.key === 'Escape') setEditingField(null);
                              }}
                            />
                            <div className="flex justify-end gap-2">
                               <button onClick={() => setEditingField(null)} className="p-2 text-slate-400"><X className="w-4 h-4" /></button>
                               <button onClick={() => handleInlineSave(pref.field as any, tempValue)} className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg"><Save className="w-4 h-4" /></button>
                            </div>
                         </div>
                      ) : (
                         <p className={cn("text-base font-bold italic", pref.value ? "text-slate-900" : "text-slate-300")}>{pref.value || 'No preference indicated.'}</p>
                      )}
                   </div>
                 ))}
              </div>

              <div className="space-y-6">
                 <h2 className="text-xl font-bold text-slate-900 italic uppercase mb-2">Agency Notes</h2>
                 <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative">
                    <History className="absolute bottom-6 right-6 w-32 h-32 opacity-5" />
                    <div className="flex items-center justify-between mb-8">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Confidential Consultant Notes</span>
                       <button onClick={() => { setEditingField('notes'); setTempValue(customer.notes || ''); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shadow-sm"><Edit3 className="w-4 h-4" /></button>
                    </div>

                    {editingField === 'notes' ? (
                       <div className="space-y-4">
                          <textarea 
                            autoFocus
                            className="w-full p-6 bg-white/10 border border-white/10 rounded-3xl outline-none focus:ring-4 focus:ring-white/5 text-sm font-medium h-64 text-white"
                            value={tempValue}
                            onChange={e => setTempValue(e.target.value)}
                          />
                          <div className="flex justify-end gap-4">
                             <button onClick={() => setEditingField(null)} className="font-bold text-xs uppercase opacity-50">Discard</button>
                             <button onClick={() => handleInlineSave('notes', tempValue)} className="font-bold text-xs uppercase text-indigo-400 underline underline-offset-4">Commit Edit</button>
                          </div>
                       </div>
                    ) : (
                       <p className="text-sm font-bold italic leading-relaxed whitespace-pre-wrap min-h-[16rem]">
                          {customer.notes || "Add internal notes about this client's profile, negotiation patterns, or service history here."}
                       </p>
                    )}
                 </div>
              </div>
           </div>
         )}

         {activeTab === 'documents' && id && (
           <div className="max-w-3xl py-8">
             <DocumentsTab entityType="customer" entityId={id} />
           </div>
         )}
      </div>

      <EditCustomerDrawer 
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        customer={customer}
        onSuccess={(updated) => {
          setCustomer(updated);
          showToast('Customer Database Updated');
          refreshCustomer();
        }}
      />

      {selectedInvoice && (
        <PaymentDrawer 
          invoice={selectedInvoice}
          isOpen={isPaymentDrawerOpen}
          onClose={() => { setIsPaymentDrawerOpen(false); setSelectedInvoice(null); }}
          onSuccess={async (pData) => {
             await invoicesService.recordPayment({
               ...pData,
               invoice_id: selectedInvoice.id,
               tenant_id: tenant!.id,
               customer_id: customer.id
             });
             window.location.reload();
          }}
        />
      )}

      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-indigo-600 border-indigo-500 text-white font-black italic' : 'bg-red-600 border-red-500 text-white font-black italic'}`}>
           <CheckCircle2 className="w-5 h-5" />
           <span className="tracking-tight uppercase text-xs">{toast.message}</span>
        </div>
      )}
      <CreateBookingDrawer 
        isOpen={isBookingDrawerOpen}
        onClose={() => { setIsBookingDrawerOpen(false); window.location.reload(); }}
        preFillLeadId={undefined} // Or we could find a lead, but usually customer-to-booking is via Quotation
      />

    </div>
  );
};
