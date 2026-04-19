import React, { useState } from 'react';
import { X, User, Mail, Shield, Plus } from 'lucide-react';
import { settingsService } from '@/features/settings/services/settingsService';
import { useAuth } from '@/core/hooks/useAuth';

interface InviteMemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberDrawer: React.FC<InviteMemberDrawerProps> = ({ isOpen, onClose, onSuccess }) => {
  const { tenant } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    designation: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsSaving(true);
    try {
      await settingsService.inviteMember(tenant.id, formData);
      onSuccess();
      onClose();
    } catch (e) {
      alert('Failed to invite member');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose}></div>
       <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
             <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black italic uppercase text-slate-900">Invite Expert Node</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expanding Neural Workforce</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-5 h-5" /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <User className="w-4 h-4" /> Identity Parameters
                   </h3>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Full Name*</label>
                      <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Email Access Node*</label>
                      <input type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Functional Designation</label>
                      <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" placeholder="e.g. Senior Consultant" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                   </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Privilege Logic
                   </h3>
                    <div className="grid grid-cols-1 gap-4">
                       {[
                         { id: 'agency_admin', label: 'Agency Admin', desc: 'Full Parameter & Financial Control' },
                         { id: 'secondary_admin', label: 'Secondary Admin', desc: 'Operational Management & Team Oversight' },
                         { id: 'staff', label: 'Operational Staff', desc: 'Execution & Service Fulfillment' }
                       ].map(role => (
                         <label key={role.id} className={clsx(
                           "flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all",
                           formData.role === role.id ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 hover:bg-slate-50"
                         )}>
                            <div className="flex items-center gap-3">
                               <input type="radio" name="role" className="accent-indigo-600" checked={formData.role === role.id} onChange={() => setFormData({...formData, role: role.id})} />
                               <div>
                                  <p className="text-xs font-black uppercase italic text-slate-900 leading-none mb-1">{role.label} Node</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase leading-none tracking-tighter">
                                     {role.desc}
                                  </p>
                               </div>
                            </div>
                         </label>
                       ))}
                    </div>
                </section>
             </div>

             <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-white">
                <button type="button" onClick={onClose} className="text-xs font-black uppercase text-slate-400">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-10 py-3 bg-slate-900 text-white font-black rounded-xl text-xs uppercase italic shadow-xl"
                >
                   {isSaving ? 'Initiating Link...' : 'Dispatch Invite'}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};

import { clsx } from 'clsx';
