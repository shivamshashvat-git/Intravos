import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Edit3, Send, CheckCircle, XCircle, Copy, Trash2, 
  ArrowLeft, FileText, Calendar, Wallet, Landmark,
  History, Info, Download, Printer, Plus, MoreHorizontal,
  ChevronRight, ArrowRight, Smartphone, CreditCard
} from 'lucide-react';
import { useInvoiceDetail } from '../hooks/useInvoiceDetail';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { InvoiceStatus, PaymentMode } from '../types/invoice';
import { PaymentDrawer } from '../components/PaymentDrawer';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invoice, isLoading, recordPayment, updateStatus, deletePayment } = useInvoiceDetail(id!);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  if (isLoading || !invoice) return <div className="h-screen flex items-center justify-center font-black italic text-slate-300 uppercase tracking-widest">Hydrating Resource...</div>;

  const isOverdue = invoice.status === 'overdue';
  const collectionProgress = (invoice.amount_paid / invoice.total_amount) * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      {/* Header Card */}
      <section className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-12">
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-10" />
         
         <div className="space-y-8 flex-1">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/invoices')} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
               <div className="flex items-center gap-3">
                  <span className="text-xl font-mono font-black text-indigo-600 italic tracking-tighter">{invoice.invoice_number}</span>
                  <StatusBadge status={invoice.status} />
               </div>
            </div>

            <div>
               <h1 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-4">{invoice.title}</h1>
               <div className="flex flex-wrap gap-6 items-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-500 italic">
                     <FileText className="w-4 h-4 text-slate-300" /> {invoice.customer?.name}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-500 italic">
                     <Calendar className="w-4 h-4 text-slate-300" /> {new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all",
                    isOverdue ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-50 text-slate-500"
                  )}>
                     <Clock className="w-4 h-4" /> Due: {new Date(invoice.due_date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-end justify-between min-w-[320px]">
            <div className="text-right space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Authorized Recovery Node</p>
               <div className="flex gap-3 justify-end">
                  {['draft', 'sent', 'overdue', 'partially_paid'].includes(invoice.status) && (
                    <button onClick={() => setIsPaymentDrawerOpen(true)} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black italic uppercase text-xs shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all outline outline-offset-4 outline-emerald-400">
                       <Wallet className="w-5 h-5 text-emerald-400" /> Record Inflow Protocol
                    </button>
                  )}
                  {invoice.status === 'paid' && (
                    <button className="px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black italic uppercase text-xs shadow-xl flex items-center gap-3">
                       <Download className="w-5 h-5" /> Download Asset PDF
                    </button>
                  )}
               </div>
            </div>

            <div className="flex gap-3 pt-8">
               <button className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-transparent hover:border-slate-200 transition-all shadow-sm"><Printer className="w-5 h-5" /></button>
               {invoice.status === 'draft' && <Link to={`/invoices/${id}/edit`} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-transparent hover:border-slate-200 transition-all shadow-sm"><Edit3 className="w-5 h-5" /></Link>}
               {invoice.status !== 'cancelled' && <button onClick={() => updateStatus('cancelled')} className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl border border-transparent hover:border-rose-100 transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>}
            </div>
         </div>
      </section>

      <div className="grid grid-cols-12 gap-12">
         {/* Main Content — Invoice Table */}
         <div className="col-span-12 lg:col-span-8 space-y-12">
            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl">
               <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic flex items-center gap-3">
                     <FileText className="w-4 h-4 text-emerald-500" /> Compliance Tax Invoice
                  </h3>
                  <div className="text-right">
                     <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">SAC PROTOCOL</p>
                     <p className="text-[10px] font-mono font-black italic">998557 - TOUR OP</p>
                  </div>
               </div>

               <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                     <tr>
                        <th className="py-4 px-10 text-[8px] font-black uppercase text-slate-400 tracking-widest">Asset Chassis</th>
                        <th className="py-4 px-6 text-[8px] font-black uppercase text-slate-400 tracking-widest">Compliance Desc</th>
                        <th className="py-4 px-6 text-[8px] font-black uppercase text-slate-400 tracking-widest text-center">Qty x Rate</th>
                        <th className="py-4 px-10 text-[8px] font-black uppercase text-slate-400 tracking-widest text-right">Taxable Ref</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 italic">
                     {invoice.items?.map(item => (
                       <tr key={item.id} className="group">
                          <td className="py-8 px-10">
                             <p className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">{item.category}</p>
                          </td>
                          <td className="py-8 px-6">
                             <p className="text-sm font-black uppercase text-slate-900 tracking-tighter leading-tight">{item.description}</p>
                             {item.hsn_sac_code && <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic tracking-widest">HSN/SAC: {item.hsn_sac_code}</p>}
                          </td>
                          <td className="py-8 px-6 text-center">
                             <p className="text-xs font-black text-slate-900">{item.quantity} units</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">@ {formatINR(item.unit_price)}</p>
                          </td>
                          <td className="py-8 px-10 text-right">
                             <p className="text-sm font-black italic text-slate-900">{formatINR(item.quantity * item.selling_price)}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">Sub-Resolution</p>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>

               <div className="bg-slate-50 p-12 border-t border-slate-100 flex flex-col items-end space-y-4">
                  <div className="w-64 space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                        <span>Base Recovery</span>
                        <span className="text-slate-900">{formatINR(invoice.subtotal)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                        <span>Incentive Gap</span>
                        <span className="text-rose-500">- {formatINR(invoice.discount_amount)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-900 tracking-widest pt-3 border-t border-slate-200">
                        <span>Taxable Anchor</span>
                        <span>{formatINR(invoice.taxable_amount)}</span>
                     </div>
                     
                     {invoice.is_igst ? (
                       <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                          <span>IGST ({invoice.igst_rate!})%</span>
                          <span>{formatINR(invoice.igst_amount!)}</span>
                       </div>
                     ) : (
                       <>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                            <span>CGST ({invoice.cgst_rate!})%</span>
                            <span>{formatINR(invoice.cgst_amount!)}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                            <span>SGST ({invoice.sgst_rate!})%</span>
                            <span>{formatINR(invoice.sgst_amount!)}</span>
                         </div>
                       </>
                     )}

                     <div className="pt-6 mt-6 border-t-2 border-slate-900 flex justify-between items-end">
                        <div className="text-left">
                           <p className="text-[8px] font-black text-slate-400 uppercase mb-1 leading-none">Authorized Settlement Total</p>
                           <p className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">{formatINR(invoice.total_amount)}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Collection Feed */}
            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-100/50">
               <div className="p-10 border-b border-slate-50 flex items-center justify-between italic">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3">
                     <History className="w-4 h-4 text-emerald-500" /> Inflow Sequence
                  </h3>
                  <p className="text-[10px] font-bold text-slate-300">Tracking digital liquidity nodes</p>
               </div>
               
               <div className="p-10 space-y-6">
                  {invoice.payments?.length === 0 ? (
                    <div className="py-12 text-center">
                       <Wallet className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-widest">No Inflow Detected in Asset Node.</p>
                    </div>
                  ) : (
                    invoice.payments?.map(p => (
                      <div key={p.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm">
                               <PaymentIcon mode={p.payment_mode} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{p.payment_mode} Inflow</p>
                               <div className="flex items-center gap-3">
                                  <h4 className="text-base font-black italic text-slate-900">{formatINR(p.amount)}</h4>
                                  <span className="text-[10px] font-mono font-bold text-slate-400">REF: {p.reference_number || 'TRX-NODE'}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right flex items-center gap-4">
                            <div>
                               <p className="text-[8px] font-black text-slate-400 uppercase italic">Resolution Date</p>
                               <p className="text-[10px] font-bold text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => deletePayment(p.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"><XCircle className="w-4 h-4" /></button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar Content */}
         <div className="col-span-12 lg:col-span-4 space-y-12">
            {/* Collection Progress Card */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative shadow-2xl overflow-hidden">
               <div className="relative z-10 space-y-10">
                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-indigo-400 uppercase italic tracking-widest">Collection Flux Statistics</p>
                     <div className="flex justify-between items-end">
                        <h4 className="text-4xl font-black italic tracking-tighter leading-none">{Math.round(collectionProgress)}%</h4>
                        <div className="text-right">
                           <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1 italic">Total Pool</p>
                           <p className="text-sm font-black">{formatINR(invoice.total_amount)}</p>
                        </div>
                     </div>
                  </div>

                  {/* Progress Arc */}
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                     <div 
                       className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(52,211,153,0.5)]" 
                       style={{ width: `${collectionProgress}%` }} 
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/10">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Already Collected</p>
                        <p className="text-base font-black italic text-emerald-400 leading-none">{formatINR(invoice.amount_paid)}</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Outflow Pressure</p>
                        <p className={clsx(
                          "text-base font-black italic leading-none",
                          invoice.amount_outstanding > 0 ? "text-rose-500" : "text-emerald-400"
                        )}>{formatINR(invoice.amount_outstanding)}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* GST Details Card */}
            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl space-y-8">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-3">
                   <Landmark className="w-4 h-4 text-emerald-500" /> Compliance Mapping
                </h3>
                
                <div className="space-y-6">
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-2 italic">AGENCY GST PROTOCOL</p>
                      <p className="text-xs font-mono font-black text-slate-900 border-b border-slate-100 pb-3 leading-none italic">{invoice.gstin_supplier || 'UNIDENTIFIED_NODE'}</p>
                   </div>
                   {invoice.gstin_customer && (
                     <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-2 italic">CORPORATE GST ANCHOR</p>
                        <p className="text-xs font-mono font-black text-indigo-600 border-b border-slate-100 pb-3 leading-none italic">{invoice.gstin_customer}</p>
                     </div>
                   )}
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-2 italic">LOGISTICS HUB (POS)</p>
                      <div className="flex items-center gap-3">
                         <MapIcon className="w-4 h-4 text-slate-300" />
                         <span className="text-xs font-black uppercase italic text-slate-900">{invoice.place_of_supply || 'GLOBAL'}</span>
                      </div>
                   </div>
                </div>
            </div>

            {/* Timeline Log */}
            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 space-y-8">
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-300" /> Life-Cycle Log
               </h3>
               <div className="space-y-6">
                  <EventNode label="NODE_INITIALIZED" date={timeAgo(invoice.created_at)} icon={Plus} color="text-slate-400" />
                  {invoice.sent_at && <EventNode label="PROTOCOL_DEPLOYED" date={timeAgo(invoice.sent_at)} icon={Send} color="text-indigo-400" />}
                  {invoice.paid_at && <EventNode label="CLEANED / RESOLVED" date={timeAgo(invoice.paid_at)} icon={CheckCircle} color="text-emerald-400" />}
               </div>
            </div>
         </div>
      </div>

      <PaymentDrawer 
        invoice={invoice} 
        isOpen={isPaymentDrawerOpen} 
        onClose={() => setIsPaymentDrawerOpen(false)} 
        onSuccess={recordPayment} 
      />
    </div>
  );
};

const EventNode = ({ label, date, icon: Icon, color }: any) => (
  <div className="flex items-center gap-4 group">
     <div className={clsx("w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm", color)}>
        <Icon className="w-4 h-4" />
     </div>
     <div className="flex-1">
        <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5 leading-none">{label}</p>
        <p className="text-[10px] font-black italic text-slate-900">{date}</p>
     </div>
  </div>
);

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const map: Record<InvoiceStatus, { bg: string, text: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600' },
    sent: { bg: 'bg-blue-100', text: 'text-blue-600' },
    partially_paid: { bg: 'bg-amber-100', text: 'text-amber-600' },
    paid: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    overdue: { bg: 'bg-rose-100', text: 'text-rose-600' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-400' }
  };
  const theme = map[status] || map.draft;
  return (
    <span className={clsx("px-3 py-1 rounded-full text-[9px] font-black uppercase italic", theme.bg, theme.text, "border-transparent tracking-widest")}>
      {status.replace('_', ' ')}
    </span>
  );
};

const PaymentIcon = ({ mode }: { mode: PaymentMode }) => {
  if (mode === 'upi') return <Smartphone className="w-5 h-5" />;
  if (mode === 'card') return <CreditCard className="w-5 h-5" />;
  if (mode === 'bank_transfer' || mode === 'neft' || mode === 'rtgs') return <Landmark className="w-5 h-5" />;
  return <Wallet className="w-5 h-5" />;
};

const MapIcon = (props: any) => <MoreHorizontal {...props} />;
const Clock = (props: any) => <History {...props} />;
