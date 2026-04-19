import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Edit3, Send, CheckCircle, XCircle, Copy, Trash2, 
  ArrowLeft, FileText, Calendar, Users, MapPin, ExternalLink,
  History, Info, Download, Printer, Plus, Clock
} from 'lucide-react';
import { quotationsService } from '../services/quotationsService';
import { invoicesService } from '../services/invoicesService';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { Quotation, QuotationStatus } from '../types/quotation';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = ['admin', 'agency_admin', 'super_admin'].includes(user?.role || '');
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      quotationsService.getQuotationById(id).then(res => {
        setQuotation(res);
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleStatusChange = async (status: QuotationStatus) => {
    if (!id) return;
    try {
      await quotationsService.updateQuotationStatus(id, status);
      toast.success(`Proposition Node: ${status.toUpperCase()}`);
      window.location.reload();
    } catch (e) {
      toast.error('Sync Error');
    }
  };

  const handleRevise = async () => {
    if (!id) return;
    try {
      if (window.confirm('Construct revision from this node? This will supersede the current version.')) {
        const newId = await quotationsService.reviseQuotation(id);
        toast.success('New Revision Node Deployed');
        navigate(`/quotations/${newId}/edit`);
      }
    } catch (e) {
      toast.error('Revision Failed');
    }
  };

  const handleGenerateInvoice = async () => {
    toast.info('Initiating Invoice Generation Sequence...');
    try {
      if (!id) return;
      const res = await invoicesService.createFromQuotation(id);
      toast.success('Invoice Resource Deployed');
      navigate(`/invoices/${res.id}`);
    } catch (e) {
      toast.error('Generation Failed');
    }
  };

  if (isLoading || !quotation) return <div className="h-screen flex items-center justify-center font-black italic text-slate-300">Syncing Parameters...</div>;

  const isRevised = quotation.status === 'revised';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Info Card */}
      <section className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-2xl shadow-slate-100 flex flex-col md:flex-row justify-between gap-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-10" />
         
         <div className="space-y-8 flex-1">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/quotations')} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><ArrowLeft className="w-5 h-5" /></button>
               <div className="flex items-center gap-3">
                  <span className="text-xl font-mono font-black text-indigo-600">{quotation.quote_number}</span>
                  <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-full font-black italic uppercase">Node v{quotation.version}</span>
               </div>
            </div>

            <div>
               <h1 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-4">{quotation.title}</h1>
               <div className="flex flex-wrap gap-6 items-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-500 italic">
                     <Users className="w-4 h-4 text-slate-300" /> {quotation.customer?.name}
                  </div>
                  {quotation.destination && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-500 italic">
                       <MapPin className="w-4 h-4 text-slate-300" /> {quotation.destination}
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-500 italic">
                     <Calendar className="w-4 h-4 text-slate-300" /> {new Date(quotation.travel_date_start!).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-end justify-between min-w-[300px] text-right">
            <StatusBadgeLarge status={quotation.status} />
            <div className="space-y-3 pt-8">
               <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Authorized Actions</p>
               <div className="flex gap-3 justify-end">
                  {quotation.status === 'draft' && (
                    <>
                      <Link to={`/quotations/${id}/edit`} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-transparent hover:border-slate-200 transition-all shadow-sm group"><Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" /></Link>
                      <button onClick={() => handleStatusChange('sent')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black italic uppercase text-xs shadow-xl shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"><Send className="w-4 h-4" /> Deploy Node</button>
                    </>
                  )}
                  {quotation.status === 'sent' && (
                    <>
                      <button onClick={() => handleStatusChange('accepted')} className="px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black italic uppercase text-[10px] hover:bg-emerald-600 hover:text-white transition-all">Accept Node</button>
                      <button onClick={() => handleStatusChange('rejected')} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black italic uppercase text-[10px] hover:bg-rose-600 hover:text-white transition-all">Reject Node</button>
                      <button onClick={handleRevise} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black italic uppercase text-[10px] hover:bg-black transition-all">Construct Revision</button>
                    </>
                  )}
                  {quotation.status === 'accepted' && (
                    <button onClick={handleGenerateInvoice} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black italic uppercase text-xs shadow-2xl flex items-center gap-3 hover:scale-105 transition-all outline outline-offset-4 outline-emerald-400">
                       <Plus className="w-5 h-5 text-emerald-400" /> Generate Invoice Protocol
                    </button>
                  )}
               </div>
            </div>
         </div>
      </section>

      {isRevised && (
        <div className="mx-12 p-6 bg-purple-900 text-white rounded-[2rem] flex items-center justify-between animate-bounce shadow-2xl">
           <div className="flex items-center gap-4">
              <History className="w-6 h-6 text-purple-300" />
              <p className="text-sm font-black italic uppercase tracking-tighter">This Node has been Superseded by a newer Revision</p>
           </div>
           <button className="px-6 py-2 bg-white text-purple-900 rounded-xl text-[10px] font-black uppercase italic tracking-widest shadow-lg">View Active Node →</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-12 px-4">
         {/* Line Items View */}
         <div className="col-span-12 lg:col-span-8 space-y-12">
            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-100/50">
               <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic flex items-center gap-3">
                     <FileText className="w-4 h-4 text-slate-300" /> Proposition Itemization
                  </h3>
                  <div className="flex gap-2">
                     <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><Printer className="w-4 h-4" /></button>
                     <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><Download className="w-4 h-4" /></button>
                  </div>
               </div>
               
               <table className="w-full">
                  <thead className="bg-slate-50/50">
                     <tr>
                        <th className="py-4 px-10 text-left text-[8px] font-black uppercase text-slate-400 tracking-widest">Chassis</th>
                        <th className="py-4 px-6 text-left text-[8px] font-black uppercase text-slate-400 tracking-widest">Resource Description</th>
                        <th className="py-4 px-6 text-center text-[8px] font-black uppercase text-slate-400 tracking-widest">Qty / Scale</th>
                        <th className="py-4 px-10 text-right text-[8px] font-black uppercase text-slate-400 tracking-widest">Liquid Value</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {quotation.items?.map(item => (
                       <tr key={item.id} className={clsx(
                         "group",
                         !item.is_included && "opacity-40 grayscale italic"
                       )}>
                          <td className="py-8 px-10">
                             <span className="text-[10px] font-black uppercase italic text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{item.category}</span>
                          </td>
                          <td className="py-8 px-6">
                             <p className={clsx("text-sm font-black uppercase text-slate-900 tracking-tighter", !item.is_included && "line-through")}>
                                {item.description}
                                {item.is_optional && <span className="ml-3 text-[8px] italic text-amber-500">(Optional Node)</span>}
                             </p>
                             {item.vendor_name && <p className="text-[10px] font-bold text-slate-400 italic mt-1 italic uppercase tracking-tighter">Authorized Partner: {item.vendor_name}</p>}
                          </td>
                          <td className="py-8 px-6 text-center">
                             <p className="text-xs font-black text-slate-900 italic">{item.quantity} {item.unit}Node(s)</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic text-center">x {formatINR(item.unit_price)}</p>
                          </td>
                          <td className="py-8 px-10 text-right">
                             <p className="text-sm font-black italic text-slate-900">{formatINR(item.quantity * item.selling_price)}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">Authorized Line Total</p>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Terms & Conditions */}
            {quotation.terms && (
              <div className="bg-slate-50 rounded-[2.5rem] p-12 border border-slate-100">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 underline decoration-indigo-200 decoration-2 underline-offset-8">Proposition Parameters (T&C)</h4>
                 <div className="prose prose-sm font-medium italic text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {quotation.terms}
                 </div>
              </div>
            )}
         </div>

         {/* Financial Column */}
         <div className="col-span-12 lg:col-span-4 space-y-12">
            {/* Summary Tool */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative shadow-2xl">
               <div className="relative z-10 space-y-8">
                  <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest italic">Consolidated Summary</h3>
                  
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                        <span>Baseline Total</span>
                        <span>{formatINR(quotation.subtotal)}</span>
                     </div>
                     {quotation.discount_amount > 0 && (
                       <div className="flex justify-between items-center text-rose-400 text-[10px] font-black uppercase tracking-widest">
                          <span>Incentive Gap</span>
                          <span>- {formatINR(quotation.discount_amount)}</span>
                       </div>
                     )}
                     <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                        <span>Taxable Pool</span>
                        <span>{formatINR(quotation.taxable_amount)}</span>
                     </div>
                     <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                        <span>GST Nodes ({quotation.gst_rate}%)</span>
                        <span>+ {formatINR(quotation.gst_amount)}</span>
                     </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 mt-8">
                     <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2 leading-none">Net Proposition Total</p>
                     <p className="text-5xl font-black italic tracking-tighter leading-none">{formatINR(quotation.total_amount)}</p>
                  </div>
               </div>
            </div>

            {/* MARGIN NODE (ADMIN ONLY) */}
            {isAdmin && (
              <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl space-y-8">
                 <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Efficiency Node</h3>
                    <div className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black italic shadow-sm border",
                      quotation.margin_percentage >= 15 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      quotation.margin_percentage >= 5 ? "bg-amber-50 text-amber-600 border-amber-100" : 
                      "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                       {Math.round(quotation.margin_percentage)}% P/L
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div>
                       <p className="text-[10px] font-black text-slate-300 uppercase italic mb-1">Cost Base</p>
                       <p className="text-base font-black italic text-slate-900">{formatINR(quotation.total_vendor_cost)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-300 uppercase italic mb-1">Net Margin</p>
                       <p className="text-base font-black italic text-emerald-600">{formatINR(quotation.total_margin)}</p>
                    </div>
                 </div>
              </div>
            )}

            {/* Timeline & Meta */}
            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 space-y-8">
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 italic">
                  <History className="w-4 h-4 text-slate-300" /> Operational Log
               </h3>
               <div className="space-y-6">
                 <TimelineNode label="INITIATED" date={timeAgo(quotation.created_at)} icon={Plus} color="text-slate-400" />
                 {quotation.sent_at && <TimelineNode label="DEPLOYED" date={timeAgo(quotation.sent_at)} icon={Send} color="text-indigo-400" />}
                 {quotation.accepted_at && <TimelineNode label="ACCEPTED" date={timeAgo(quotation.accepted_at)} icon={CheckCircle} color="text-emerald-400" />}
                 {quotation.status === 'rejected' && <TimelineNode label="REJECTED" date="Operation Terminated" icon={XCircle} color="text-rose-400" />}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const TimelineNode = ({ label, date, icon: Icon, color }: any) => (
  <div className="flex items-center gap-4 relative">
     <div className={clsx("w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm", color)}>
        <Icon className="w-4 h-4" />
     </div>
     <div className="flex-1 min-w-0">
        <p className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">{label}</p>
        <p className="text-[10px] font-black italic text-slate-900 truncate">{date}</p>
     </div>
  </div>
);

const StatusBadgeLarge = ({ status }: { status: QuotationStatus }) => {
  const map: Record<QuotationStatus, { bg: string, text: string, icon: any }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-900', icon: Info },
    sent: { bg: 'bg-blue-100', text: 'text-blue-900', icon: Send },
    accepted: { bg: 'bg-emerald-100', text: 'text-emerald-900', icon: CheckCircle },
    rejected: { bg: 'bg-rose-100', text: 'text-rose-900', icon: XCircle },
    revised: { bg: 'bg-indigo-100', text: 'text-indigo-900', icon: History },
    expired: { bg: 'bg-amber-100', text: 'text-amber-900', icon: Clock }
  };
  const theme = map[status] || map.draft;
  return (
    <div className={clsx("flex items-center gap-3 px-8 py-3 rounded-2xl border transition-all", theme.bg, theme.text, "border-transparent shadow-sm shadow-black/5")}>
       <theme.icon className="w-5 h-5" />
       <span className="text-xs font-black uppercase italic tracking-[0.2em]">{status}</span>
    </div>
  );
};
