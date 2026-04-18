import React, { useState } from 'react';
import { X, Landmark, DollarSign, Wallet, CreditCard, Hash, ShieldCheck } from 'lucide-react';
import { settingsService } from '@/features/settings/services/settingsService';
import { useAuth } from '@/core/hooks/useAuth';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface AddBankAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const AddBankAccountDrawer: React.FC<AddBankAccountDrawerProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const { tenant } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    account_name: initialData?.account_name || '',
    bank_name: initialData?.bank_name || '',
    account_number: initialData?.account_number || '',
    ifsc: initialData?.ifsc || '',
    acc_type: initialData?.acc_type || 'current',
    is_primary: initialData?.is_primary || false,
    running_balance: initialData?.running_balance || 0
  });

  const [confirmAccNumber, setConfirmAccNumber] = useState(initialData?.account_number || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    if (formData.account_number !== confirmAccNumber) {
      return toast.error('Account number confirmation mismatch');
    }

    setIsSaving(true);
    try {
      if (initialData?.id) {
        await settingsService.updateBankAccount(initialData.id, formData as any, tenant.id);
        toast.success('Liquidity node updated');
      } else {
        await settingsService.createBankAccount(tenant.id, formData as any);
        toast.success('Liquidity node registered');
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Node stabilization failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-bold italic">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}></div>
       <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 italic no-scrollbar overflow-y-auto">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
             <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black italic uppercase text-slate-900">{initialData ? 'Adjust Asset Node' : 'Register Bank Node'}</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Liquidity Control</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-5 h-5" /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10">
                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <Landmark className="w-4 h-4" /> Entity Identity
                   </h3>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Internal Reference Name*</label>
                      <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase italic" placeholder="e.g. HDFC MAIN CURRENT" value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value.toUpperCase()})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Institution Name*</label>
                      <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase italic" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value.toUpperCase()})} />
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Secure Logic
                   </h3>
                   <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Account Number*</label>
                         <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tracking-[0.2em]" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Confirm Account Number*</label>
                         <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tracking-[0.2em]" value={confirmAccNumber} onChange={e => setConfirmAccNumber(e.target.value)} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">IFSC Node Key*</label>
                         <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest" maxLength={11} value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value.toUpperCase()})} />
                      </div>
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-purple-600 tracking-widest flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Protocol Type
                   </h3>
                   <div className="grid grid-cols-3 gap-3">
                      {['current', 'savings', 'upi'].map(type => (
                        <button key={type} type="button" onClick={() => setFormData({...formData, acc_type: type as any})} className={clsx(
                           "py-6 rounded-2xl border-2 text-[10px] font-black uppercase transition-all flex flex-col items-center gap-3 italic tracking-widest",
                           formData.acc_type === type ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-xl shadow-indigo-100" : "border-slate-50 bg-slate-50 text-slate-400"
                        )}>
                           {type === 'upi' ? <Wallet className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                           {type}
                        </button>
                      ))}
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Liquid Initialization
                   </h3>
                   <div className="grid grid-cols-1 gap-6">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Current Running Ledger Balance (INR)*</label>
                         <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-black italic tracking-tighter" value={formData.running_balance} onChange={e => setFormData({...formData, running_balance: parseFloat(e.target.value) || 0})} />
                      </div>
                      <label className="flex items-center gap-4 group cursor-pointer p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-emerald-50 hover:border-emerald-100">
                         <div className={clsx(
                           "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                           formData.is_primary ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-100" : "bg-white border-slate-200 group-hover:border-emerald-500"
                         )}>
                           {formData.is_primary && <ShieldCheck className="w-4 h-4 text-white" />}
                         </div>
                         <input type="checkbox" className="hidden" checked={formData.is_primary} onChange={e => setFormData({...formData, is_primary: e.target.checked})} />
                         <div>
                            <p className="text-[10px] font-black uppercase italic leading-none mb-1">Set as Primary Node</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase leading-none tracking-tighter italic">Primary hub for transactional outputs</p>
                         </div>
                      </label>
                   </div>
                </section>
             </div>

             <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-white sticky bottom-0">
                <button type="button" onClick={onClose} className="text-xs font-black uppercase text-slate-400 italic">Decline</button>
                <button type="submit" disabled={isSaving} className="px-12 py-4 bg-slate-900 text-white font-black rounded-[2rem] text-xs uppercase italic shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-slate-200">
                   {isSaving ? 'Synchronizing Hub...' : (initialData ? 'Update Node Hub' : 'Initialize Node Hub')}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};
