import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, Eye, Send, Plus, Trash2, Settings as SettingsIcon, 
  ChevronRight, ArrowLeft, GripVertical, Plane, Building, 
  Car, Target, FileCheck, Shield, Package, Info
} from 'lucide-react';
import { useQuoteBuilder } from '../hooks/useQuoteBuilder';
import { useAuth } from '@/core/hooks/useAuth';
import { formatINR } from '@/utils/currency';
import { customersService } from '@/features/crm/services/customersService';
import { leadsService } from '@/features/crm/services/leadsService';
import { ItemCategory, DiscountType } from '../types/quotation';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const QuoteBuilderPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const leadId = searchParams.get('lead_id');

  const { 
    quotation, setQuotation, items, isLoading, isSaving, isDirty,
    load, save, addItem, updateItem, removeItem, reorderItems 
  } = useQuoteBuilder(id);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);

  // Initial Load
  useEffect(() => {
    if (id) {
      load(id);
    } else if (leadId) {
      // Pre-fill from Lead
      leadsService.getLeadById(leadId).then(res => {
         const { lead } = res;
         setQuotation(prev => ({
           ...prev,
           lead_id: leadId,
           customer_id: lead.customer_id || undefined,
           title: lead.destination ? `${lead.destination} Trip` : '',
           destination: lead.destination || '',
           pax_adults: lead.guests || 1,
           travel_date_start: lead.travel_start_date || '',
         }));
      });
    }
  }, [id, leadId]);

  // Handle Customer Search
  useEffect(() => {
    if (customerSearch.length > 2 && user?.tenant_id) {
      customersService.getCustomers(user.tenant_id, { search: customerSearch }).then(res => {
        setCustomerResults(res.data);
      });
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch]);

  const handleSave = async () => {
    try {
      if (!quotation.title) return toast.error('Identify Proposition Title');
      const savedId = await save();
      toast.success('Proposition Node Synced');
      if (!id) navigate(`/quotations/${savedId}/edit`, { replace: true });
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
      {/* Builder Header */}
      <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
         <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
               <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">
                     {id ? 'Edit Proposition' : 'Architect New Quote'}
                  </h1>
                  {isDirty && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full animate-pulse">Unsaved Node Flux</span>}
                  {quotation.version! > 1 && <span className="bg-indigo-900 text-white text-[10px] px-2 py-0.5 rounded-lg font-black italic">v{quotation.version}</span>}
               </div>
               {leadId && <p className="text-[10px] font-bold text-slate-400 italic">Inherited from Lead Resource # {leadId.slice(0, 8)}</p>}
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-slate-100 text-slate-400 font-black rounded-xl text-[10px] uppercase shadow-sm hover:text-slate-900 transition-all flex items-center gap-2">
               <Eye className="w-4 h-4" /> Preview Node
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase shadow-xl hover:bg-black transition-all flex items-center gap-2">
               <Save className={clsx("w-4 h-4", isSaving && "animate-spin")} /> {isSaving ? 'Syncing...' : 'Sync Proposition'}
            </button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Line Items Editor */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-slate-50/30">
           {/* Section 1: Basic Info */}
           <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-10">
              <div className="grid grid-cols-12 gap-8">
                 <div className="col-span-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Proposition Title*</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black italic uppercase focus:bg-white focus:border-indigo-200 transition-all"
                      placeholder="E.G. BALI FAMILY TRIP — 6 NIGHTS"
                      value={quotation.title}
                      onChange={e => setQuotation({...quotation, title: e.target.value.toUpperCase()})}
                    />
                 </div>
                 <div className="col-span-4 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Customer Selection*</label>
                    {quotation.customer_id && leadId ? (
                       <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-3 opacity-60">
                          <div className="w-6 h-6 rounded-lg bg-slate-200" />
                          <span className="text-[10px] font-black uppercase text-slate-500 italic">Mapping Locked</span>
                       </div>
                    ) : (
                      <div className="relative">
                        <input 
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:bg-white focus:border-indigo-200"
                          placeholder="SEARCH BY NAME/PHONE..."
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                        />
                        {customerResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden max-h-60 overflow-y-auto">
                            {customerResults.map(c => (
                              <button key={c.id} onClick={() => { setQuotation({...quotation, customer_id: c.id}); setCustomerSearch(c.name); setCustomerResults([]); }} className="w-full p-4 text-left hover:bg-slate-50 flex flex-col transition-all border-b border-slate-50 last:border-0">
                                <span className="text-xs font-black uppercase italic text-slate-900">{c.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">{c.phone}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-4 gap-8">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Destination Node</label>
                   <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase italic" value={quotation.destination || ''} onChange={e => setQuotation({...quotation, destination: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Chrono</label>
                   <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black" value={quotation.travel_date_start || ''} onChange={e => setQuotation({...quotation, travel_date_start: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Termination Chrono</label>
                   <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black" value={quotation.travel_date_end || ''} onChange={e => setQuotation({...quotation, travel_date_end: e.target.value})} />
                </div>
                <div className="flex gap-2">
                   <div className="flex-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Adults</label>
                      <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-center" value={quotation.pax_adults} onChange={e => setQuotation({...quotation, pax_adults: parseInt(e.target.value) || 1})} />
                   </div>
                   <div className="flex-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Child</label>
                      <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-center" value={quotation.pax_children} onChange={e => setQuotation({...quotation, pax_children: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="flex-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Infant</label>
                      <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-center" value={quotation.pax_infants} onChange={e => setQuotation({...quotation, pax_infants: parseInt(e.target.value) || 0})} />
                   </div>
                </div>
              </div>
           </section>

           {/* Section 2: Items Editor */}
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Line Item Sequence</h3>
                 <span className="text-[10px] font-bold text-slate-300 italic">Drag to prioritize nodes</span>
              </div>
              
              <div className="space-y-4">
                 {items.map((item, index) => (
                   <div key={index} className="group animate-in slide-in-from-left-4 duration-300">
                      <div className={clsx(
                        "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all group-hover:shadow-md",
                        !item.is_included && "opacity-50 grayscale bg-slate-50"
                      )}>
                         <div className="p-4 flex items-center gap-4">
                            <button className="cursor-grab p-1 text-slate-300 hover:text-slate-600 active:cursor-grabbing"><GripVertical className="w-4 h-4" /></button>
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                               {categories.find(c => c.id === item.category)?.icon && React.createElement(categories.find(c => c.id === item.category)!.icon, { className: 'w-5 h-5 text-slate-400' })}
                            </div>
                            
                            <select 
                              className="w-32 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase italic appearance-none" 
                              value={item.category}
                              onChange={e => updateItem(index, { category: e.target.value as ItemCategory })}
                            >
                               {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>

                            <input 
                              placeholder="Describe Resource..." 
                              className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold italic uppercase focus:bg-white" 
                              value={item.description}
                              onChange={e => updateItem(index, { description: e.target.value })}
                            />

                            <div className="flex items-center gap-2">
                               <input type="number" placeholder="Qty" className="w-16 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs font-black" value={item.quantity} onChange={e => updateItem(index, { quantity: parseInt(e.target.value) || 1 })} />
                               <select className="w-24 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold italic" value={item.unit} onChange={e => updateItem(index, { unit: e.target.value })}>
                                  <option value="per person">Per Pax</option>
                                  <option value="per night">Per Night</option>
                                  <option value="flat">Flat</option>
                               </select>
                            </div>

                            <div className="w-32">
                               <input type="number" placeholder="Unit ₹" className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-white text-right" value={item.unit_price} onChange={e => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })} />
                            </div>

                            <div className="w-32 text-right">
                               <p className="text-[10px] font-black italic text-slate-800">{formatINR((item.quantity || 1) * (item.selling_price || 0))}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Line Total</p>
                            </div>

                            <div className="flex gap-1">
                               <button onClick={() => updateItem(index, { _isExpanded: !(item as any)._isExpanded } as any)} className={clsx("p-3 rounded-xl transition-all", (item as any)._isExpanded ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}>
                                 <SettingsIcon className="w-4 h-4" />
                               </button>
                               <button onClick={() => removeItem(index)} className="p-3 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>

                         {/* Inline Expanded Settings */}
                         {(item as any)._isExpanded && (
                           <div className="p-8 bg-indigo-50/30 border-t border-indigo-50 grid grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
                              {isAdmin && (
                                <div>
                                   <label className="text-[8px] font-black text-indigo-400 uppercase mb-2 block italic tracking-widest">Internal Cost Node ₹</label>
                                   <input type="number" className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-xs font-black text-indigo-600" value={item.cost_price} onChange={e => updateItem(index, { cost_price: parseFloat(e.target.value) || 0 })} />
                                </div>
                              )}
                              <div>
                                 <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block italic">Vendor Identification</label>
                                 <input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold" value={item.vendor_name || ''} onChange={e => updateItem(index, { vendor_name: e.target.value })} />
                              </div>
                              <div className="flex gap-4 items-center">
                                 <label className="flex items-center gap-3 cursor-pointer">
                                    <div onClick={() => updateItem(index, { is_optional: !item.is_optional })} className={clsx("w-5 h-5 rounded-md border flex items-center justify-center transition-all", item.is_optional ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200")}>
                                       {item.is_optional && <FileCheck className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 italic">Optional</span>
                                 </label>
                                 <label className="flex items-center gap-3 cursor-pointer">
                                    <div onClick={() => updateItem(index, { is_included: !item.is_included })} className={clsx("w-5 h-5 rounded-md border flex items-center justify-center transition-all", item.is_included ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200")}>
                                       {item.is_included && <FileCheck className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 italic">Included</span>
                                 </label>
                              </div>
                              <div>
                                 <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block italic">Parameter Notes</label>
                                 <input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold" value={item.notes || ''} onChange={e => updateItem(index, { notes: e.target.value })} />
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                 ))}
              </div>

              {/* Add Item Controls */}
              <div className="pt-6 flex flex-wrap gap-4 items-center">
                 <button onClick={() => addItem()} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black italic uppercase text-[10px] shadow-xl shadow-indigo-200 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" /> Add Logic Node
                 </button>
                 <span className="text-[8px] font-black text-slate-300 uppercase italic">Or fast deploy Category:</span>
                 <div className="flex gap-2">
                    {categories.slice(0, 4).map(c => (
                      <button key={c.id} onClick={() => addItem(c.id)} className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[8px] font-black uppercase text-slate-500 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                         <c.icon className="w-3 h-3" /> {c.label}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT PANEL — Summary & Settings */}
        <aside className="w-[480px] border-l border-slate-200 bg-white p-12 overflow-y-auto space-y-10 shadow-2xl relative">
           <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">Node Parameters</h3>
              
              <div className="bg-slate-50 rounded-[2rem] p-8 space-y-8 border border-slate-100">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">VALID UNTIL</label>
                       <input type="date" className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black" value={quotation.valid_until || ''} onChange={e => setQuotation({...quotation, valid_until: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">GST PROTOCOL</label>
                       <select className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase italic" value={quotation.gst_rate} onChange={e => setQuotation({...quotation, gst_rate: parseFloat(e.target.value)})}>
                          <option value={0}>0% EXEMPT</option>
                          <option value={5}>5% TOUR OPERATOR</option>
                          <option value={12}>12% AGENT</option>
                          <option value={18}>18% SERVICES</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">DISCOUNT MODEL</label>
                       <select className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase italic" value={quotation.discount_type} onChange={e => setQuotation({...quotation, discount_type: e.target.value as DiscountType})}>
                          <option value="none">NONE</option>
                          <option value="flat">FLAT ₹</option>
                          <option value="percentage">PERCENT %</option>
                       </select>
                    </div>
                    {quotation.discount_type !== 'none' && (
                       <div className="animate-in slide-in-from-right-4 duration-300">
                          <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">RELIANCE VALUE</label>
                          <input type="number" className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-center" value={quotation.discount_value} onChange={e => setQuotation({...quotation, discount_value: parseFloat(e.target.value) || 0})} />
                       </div>
                    )}
                 </div>
              </div>

              <div>
                 <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block tracking-widest px-2">CLIENT-FACING TERMS & CONDITIONS</label>
                 <textarea className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-medium h-40 italic focus:bg-white transition-all shadow-inner" placeholder="E.G. 50% ADVANCE TO INITIATE NODES..." value={quotation.terms || ''} onChange={e => setQuotation({...quotation, terms: e.target.value})} />
              </div>
           </div>

           {/* TOTALS CARD */}
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <span>Baseline Logic</span>
                    <span>{formatINR(quotation.subtotal || 0)}</span>
                 </div>
                 {quotation.discount_amount! > 0 && (
                   <div className="flex justify-between items-center text-rose-400 text-[10px] font-black uppercase tracking-widest">
                      <span>Incentive Model</span>
                      <span>- {formatINR(quotation.discount_amount || 0)}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <span>Taxable Exposure</span>
                    <span>{formatINR(quotation.taxable_amount || 0)}</span>
                 </div>
                 <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <span>GST Resolution ({quotation.gst_rate}%)</span>
                    <span>+ {formatINR(quotation.gst_amount || 0)}</span>
                 </div>

                 <div className="pt-6 border-t border-white/10 mt-6 overflow-hidden">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Authorized Setlement Total</p>
                    <div className="flex items-end justify-between gap-4">
                       <h4 className="text-4xl font-black italic tracking-tighter leading-none">{formatINR(quotation.total_amount || 0)}</h4>
                       <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase italic">
                          <Info className="w-3 h-3" /> All Inclusive
                       </div>
                    </div>
                 </div>
              </div>

              {/* ADMIN MARGIN SECTION */}
              {isAdmin && (
                <div className="mt-12 pt-8 border-t border-white/10 space-y-6 relative z-10">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Total Cost Base</p>
                         <p className="text-sm font-black italic">{formatINR(quotation.total_vendor_cost || 0)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Unit Net Margin</p>
                         <p className={clsx(
                           "text-sm font-black italic",
                           quotation.total_margin! > 0 ? "text-emerald-400" : "text-rose-400"
                         )}>{formatINR(quotation.total_margin || 0)}</p>
                      </div>
                   </div>
                   <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={clsx(
                        "h-full transition-all duration-1000",
                        quotation.margin_percentage! >= 15 ? "bg-emerald-400" : 
                        quotation.margin_percentage! >= 5 ? "bg-amber-400" : "bg-rose-400"
                      )} style={{ width: `${Math.min(100, Math.max(0, (quotation.margin_percentage || 0)))}%` }} />
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white/40 uppercase italic">Efficiency Node</span>
                      <span className="text-xl font-black italic">{Math.round(quotation.margin_percentage || 0)}% P/L</span>
                   </div>
                </div>
              )}
           </div>

           <div className="sticky bottom-0 bg-white pt-6 pb-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <button className="py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-[10px] uppercase italic tracking-widest hover:bg-slate-100 transition-all">Send to WhatsApp</button>
                 <button className="py-4 bg-slate-50 text-slate-400 font-black rounded-2xl text-[10px] uppercase italic tracking-widest hover:bg-slate-100 transition-all">Email Proposition</button>
              </div>
              <button 
                onClick={() => updateItem(0, { status: 'sent' } as any)} 
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] text-[10px] uppercase italic tracking-widest shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-[0.98] transition-all"
              >
                 <Send className="w-5 h-5" /> Deploy Proposal to Client Node
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
};
