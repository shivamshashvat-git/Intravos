import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Save, Eye, Plus, Trash2, Settings as SettingsIcon, 
  ArrowLeft, GripVertical, FileText, Info, Building, Plane, Car, Target, FileCheck, Shield, Package
} from 'lucide-react';
import { useInvoiceBuilder } from '../hooks/useInvoiceBuilder';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { customersService } from '@/features/crm/services/customersService';
import { invoicesService } from '../services/invoicesService';
import { ItemCategory, DiscountType } from '../types/quotation';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const InvoiceBuilderPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, tenant } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const quoteId = searchParams.get('quotation_id');

  const { 
    invoice, setInvoice, items, isLoading, setIsLoading, isSaving, isDirty,
    load, save, addItem, updateItem, removeItem 
  } = useInvoiceBuilder(id);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      load(id);
    } else if (quoteId) {
      setIsLoading(true);
      invoicesService.createFromQuotation(quoteId).then(res => {
         navigate(`/invoices/${res.id}/edit`, { replace: true });
      }).catch(e => {
         toast.error('Failed to pre-fill from quotation');
         setIsLoading(false);
      });
    }
  }, [id, quoteId]);

  const handleSave = async () => {
    try {
      if (!invoice.title) return toast.error('Proposition Identity Missing');
      const savedId = await save();
      toast.success('Invoice Resource Synced');
      if (!id) navigate(`/invoices/${savedId}/edit`, { replace: true });
    } catch (e) {
      toast.error('Sync Error');
    }
  };

  const categories: { id: ItemCategory; label: string; icon: any }[] = [
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'hotel', label: 'Hotel', icon: Building },
    { id: 'transfer', label: 'Transfer', icon: Car },
    { id: 'activity', label: 'Activity', icon: Target },
    { id: 'visa', label: 'Visa', icon: FileCheck },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'misc', label: 'Misc', icon: Package },
  ];

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black italic text-slate-300">Synchronizing Parameters...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -m-4">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
         <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
               <h1 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">
                  {id ? 'Edit Billing Node' : 'Initialize Asset Node'}
               </h1>
               {isDirty && <span className="text-[7px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full ml-3">Dirty Flux</span>}
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase shadow-xl hover:bg-black transition-all flex items-center gap-2">
               <Save className={clsx("w-4 h-4", isSaving && "animate-spin")} /> {isSaving ? 'Syncing...' : 'Sync Asset Node'}
            </button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side — Items */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-slate-50/30">
           <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-10">
              <div className="grid grid-cols-12 gap-8">
                 <div className="col-span-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Billing Description*</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black italic uppercase focus:bg-white" value={invoice.title} onChange={e => setInvoice({...invoice, title: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="col-span-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Mapping Status</label>
                    <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 opacity-60 flex items-center justify-between">
                       <span className="text-[10px] font-black italic uppercase text-slate-500">Corporate Anchored</span>
                       <FileCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block font-mono">NODE_DATE</label>
                    <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black" value={invoice.invoice_date} onChange={e => setInvoice({...invoice, invoice_date: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block font-mono">DUE_THRESHOLD</label>
                    <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black" value={invoice.due_date} onChange={e => setInvoice({...invoice, due_date: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block font-mono">RECOVERY_TERMS</label>
                    <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold italic" placeholder="E.G. 100% ADVANCE" value={invoice.payment_terms || ''} onChange={e => setInvoice({...invoice, payment_terms: e.target.value})} />
                 </div>
              </div>
           </section>

           <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic px-2">Compliance Itemization</h3>
              <div className="space-y-4">
                 {items.map((item, index) => (
                   <div key={index} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group">
                      <div className="p-4 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            {categories.find(c => c.id === item.category)?.icon && React.createElement(categories.find(c => c.id === item.category)!.icon, { className: 'w-5 h-5 text-slate-400' })}
                         </div>
                         <input className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold italic uppercase" placeholder="RESOURCE IDENTIFY..." value={item.description} onChange={e => updateItem(index, { description: e.target.value })} />
                         <div className="flex gap-2">
                             <input type="number" className="w-16 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs font-black" value={item.quantity} onChange={e => updateItem(index, { quantity: parseInt(e.target.value) || 1 })} />
                             <input type="number" className="w-28 p-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-right text-xs font-black" value={item.unit_price} onChange={e => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })} />
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => updateItem(index, { _isExpanded: !(item as any)._isExpanded })} className={clsx("p-3 rounded-xl transition-all", (item as any)._isExpanded ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-300")}><SettingsIcon className="w-4 h-4" /></button>
                            <button onClick={() => removeItem(index)} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                      {(item as any)._isExpanded && (
                        <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-200">
                           <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block italic tracking-widest">HSN/SAC Protocol</label>
                              <input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase" placeholder="998557" value={item.hsn_sac_code || ''} onChange={e => updateItem(index, { hsn_sac_code: e.target.value })} />
                           </div>
                           {isAdmin && (
                             <div>
                                <label className="text-[8px] font-black text-indigo-400 uppercase mb-2 block italic tracking-widest">Internal Net Node ₹</label>
                                <input type="number" className="w-full p-3 bg-white border border-indigo-50 rounded-xl text-xs font-black text-indigo-600" value={item.cost_price} onChange={e => updateItem(index, { cost_price: parseFloat(e.target.value) || 0 })} />
                             </div>
                           )}
                        </div>
                      )}
                   </div>
                 ))}
              </div>
              <button onClick={() => addItem()} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black italic uppercase text-[10px] shadow-xl hover:bg-indigo-700 transition-all">
                 <Plus className="w-4 h-4" /> Add Asset Parameter
              </button>
           </div>
        </div>

        {/* Right Side — Summary */}
        <aside className="w-[480px] border-l border-slate-200 bg-white p-12 overflow-y-auto space-y-10 shadow-2xl">
           <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Tax Logic & Protocol</h3>
              
              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-8">
                 <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black uppercase italic text-slate-600">Inter-State Supply (IGST)</span>
                    <button onClick={() => setInvoice({...invoice, is_igst: !invoice.is_igst})} className={clsx(
                      "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                      invoice.is_igst ? "bg-indigo-600" : "bg-slate-200"
                    )}>
                       <div className={clsx("w-4 h-4 bg-white rounded-full shadow-md transition-all", invoice.is_igst ? "translate-x-6" : "translate-x-0")} />
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">GST DEPLOYMENT</label>
                        <select className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase italic" value={invoice.gst_rate} onChange={e => setInvoice({...invoice, gst_rate: parseFloat(e.target.value)})}>
                           <option value={5}>5% TOUR OP</option>
                           <option value={12}>12% AGENT</option>
                           <option value={18}>18% SERVICES</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">PLACE OF SUPPLY</label>
                        <select className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase italic" value={invoice.place_of_supply || '07-Delhi'} onChange={e => setInvoice({...invoice, place_of_supply: e.target.value})}>
                           <option value="07-Delhi">07-Delhi</option>
                           <option value="19-West Bengal">19-WB</option>
                           <option value="27-Maharashtra">27-MH</option>
                           <option value="29-Karnataka">29-KA</option>
                           <option value="33-Tamil Nadu">33-TN</option>
                        </select>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 space-y-6">
                    <p className="text-[9px] font-black text-indigo-400 uppercase italic tracking-widest mb-4">Financial Resolution</p>
                    <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                       <span>Total Node Value</span>
                       <span>{formatINR(invoice.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                       <span>Tax Exposure</span>
                       <span>{formatINR(invoice.taxable_amount || 0)}</span>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                        {invoice.is_igst ? (
                          <div className="flex justify-between items-center text-indigo-400 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                             <span>IGST ({invoice.igst_rate}%)</span>
                             <span>+ {formatINR(invoice.igst_amount || 0)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                               <span>CGST ({invoice.cgst_rate}%)</span>
                               <span>+ {formatINR(invoice.cgst_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                               <span>SGST ({invoice.sgst_rate}%)</span>
                               <span>+ {formatINR(invoice.sgst_amount || 0)}</span>
                            </div>
                          </>
                        )}
                    </div>

                    <div className="pt-8 border-t border-white/10 flex items-end justify-between">
                       <div>
                          <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1 leading-none">Net Liquid Asset</p>
                          <h4 className="text-4xl font-black italic tracking-tighter leading-none">{formatINR(invoice.total_amount || 0)}</h4>
                       </div>
                       <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase italic flex items-center gap-1.5"><Info className="w-3 h-3" /> Post-Tax</div>
                    </div>
                 </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};
