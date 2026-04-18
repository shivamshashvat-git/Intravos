import React, { useState } from 'react';
import { X, Wallet, DollarSign, Calendar, CreditCard, Landmark, Smartphone, FileText } from 'lucide-react';
import { Invoice, PaymentMode } from '../types/invoice';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface Props {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => Promise<void>;
}

export const PaymentDrawer: React.FC<Props> = ({ invoice, isOpen, onClose, onSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState({
    amount: invoice.amount_outstanding,
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'upi' as PaymentMode,
    reference_number: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.amount <= 0) return toast.error('Identify positive liquid flow');
    if (data.amount > invoice.amount_outstanding + 1) {
       return toast.error(`Inflow exceeds outstanding balance of ${formatINR(invoice.amount_outstanding)}`);
    }

    setIsSaving(true);
    try {
      await onSuccess(data);
      toast.success('Inflow Protocol Resolved');
      onClose();
    } catch (e) {
      toast.error('Protocol Failure');
    } finally {
      setIsSaving(false);
    }
  };

  const modeLabels: Record<PaymentMode, string> = {
    upi: 'UPI TRANSACTION ID',
    cash: 'CASH RECEIPT REF',
    neft: 'UTR NUMBER',
    rtgs: 'RTGS REFERENCE',
    cheque: 'CHEQUE NUMBER',
    card: 'LAST 4 DIGITS',
    bank_transfer: 'TRANSFER REFERENCE',
    other: 'IDENTIFY REFERENCE'
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
         <header className="p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
               <h2 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Record Inflow Node</h2>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Invoice: {invoice.invoice_number}</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
         </header>

         <div className="flex-1 overflow-y-auto p-12 space-y-12">
            {/* Balance Summary */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 grid grid-cols-2 gap-8">
                  <div>
                     <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Invoice Total</p>
                     <p className="text-lg font-black italic">{formatINR(invoice.total_amount)}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">Collected Node</p>
                     <p className="text-lg font-black italic text-emerald-400">{formatINR(invoice.amount_paid)}</p>
                  </div>
                  <div className="col-span-2 pt-6 border-t border-white/5">
                     <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic leading-none">Net Pressure Balance</p>
                     <p className="text-4xl font-black italic tracking-tighter text-rose-400 leading-none">{formatINR(invoice.amount_outstanding)}</p>
                  </div>
               </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
               <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Liquid Amount*</label>
                     <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input type="number" step="0.01" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black italic focus:bg-white" value={data.amount} onChange={e => setData({...data, amount: parseFloat(e.target.value) || 0})} />
                     </div>
                  </div>
                  <div className="col-span-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Chrono Map*</label>
                     <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input type="date" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black focus:bg-white" value={data.payment_date} onChange={e => setData({...data, payment_date: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Transmission Mode*</label>
                  <div className="grid grid-cols-4 gap-3">
                     {[
                       { id: 'upi', label: 'UPI', icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                       { id: 'card', label: 'CARD', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                       { id: 'neft', label: 'NEFT', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                       { id: 'cash', label: 'CASH', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' }
                     ].map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setData({...data, payment_mode: mode.id as PaymentMode})}
                          className={clsx(
                            "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                            data.payment_mode === mode.id ? "bg-white border-slate-900 ring-2 ring-slate-900/5 shadow-lg" : "bg-slate-50 border-transparent hover:border-slate-100"
                          )}
                        >
                           <mode.icon className={clsx("w-5 h-5", data.payment_mode === mode.id ? mode.color : "text-slate-300")} />
                           <span className={clsx("text-[8px] font-black uppercase tracking-widest", data.payment_mode === mode.id ? "text-slate-900" : "text-slate-300")}>{mode.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">{modeLabels[data.payment_mode]}</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic" value={data.reference_number} onChange={e => setData({...data, reference_number: e.target.value})} placeholder="X X X X X X X X" />
               </div>

               <div className="pt-8 flex gap-4">
                  <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase italic text-[10px] tracking-widest hover:text-slate-900 transition-all">Abort</button>
                  <button type="submit" disabled={isSaving} className="flex-2 px-12 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                     <CheckCircle className="w-4 h-4 text-emerald-400" /> {isSaving ? 'Resolving...' : 'Commit Inflow Node'}
                  </button>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

const CheckCircle = (props: any) => <FileText {...props} />;
