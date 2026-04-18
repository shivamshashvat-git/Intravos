import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Building2, Users, FileText, 
  Landmark, CreditCard, Bell, Save, ShieldCheck, 
  ExternalLink, Upload, Check, AlertCircle, Trash2, Mail, Plus, Edit3, ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/core/hooks/useAuth';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { settingsService } from '@/features/settings/services/settingsService';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { TeamMember, BankAccount, TenantSettings } from '../types/settings';
import { InviteMemberDrawer } from '../components/InviteMemberDrawer';
import { AddBankAccountDrawer } from '../components/AddBankAccountDrawer';
import { TrashPanel } from '../components/TrashPanel';

export const SettingsPage: React.FC = () => {
  const { user, tenant: authTenant } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('agency');
  const { tenant, members, bankAccounts, isLoading, isSaving, updateProfile, uploadLogo, refresh } = useSettings();
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) setActiveTab(hash);
  }, [location.hash]);

  const tabs = [
    { id: 'agency', label: 'Agency Profile', icon: Building2 },
    { id: 'team', label: 'Team Members', icon: Users, adminOnly: true },
    { id: 'invoice', label: 'Invoice & Quote', icon: FileText, adminOnly: true },
    { id: 'bank', label: 'Bank Accounts', icon: Landmark, adminOnly: true },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, adminOnly: true },
    { id: 'trash', label: 'Recycle Bin', icon: Trash2, adminOnly: true },
  ];

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black italic text-slate-300">Synchronizing Parameters...</div>;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-100">
       {/* Settings Navigation */}
       <aside className="w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest px-4 font-mono italic">Registry Control</p>
          {tabs.map(t => (
            (!t.adminOnly || isAdmin) && (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-xs font-black uppercase transition-all group italic",
                  activeTab === t.id ? "bg-white text-indigo-600 shadow-xl shadow-slate-200/50 border border-slate-200" : "text-slate-400 hover:text-slate-600"
                )}
              >
                 <t.icon className={clsx("w-4 h-4 transition-transform group-hover:scale-110", activeTab === t.id ? "text-indigo-600" : "text-slate-300")} />
                 {t.label}
              </button>
            )
          ))}

          <div className="mt-auto p-6 bg-slate-900 rounded-[2rem] text-white space-y-4 shadow-xl">
             <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 leading-none">Access Level</p>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {isAdmin ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-amber-400" />}
                </div>
                <div>
                   <p className="text-[10px] font-black italic uppercase leading-none mb-1">{user?.role} NODE</p>
                   <p className="text-[8px] font-bold text-white/40 uppercase leading-none tracking-tighter">{isAdmin ? 'Full Parameter Control' : 'Read-only Access'}</p>
                </div>
             </div>
          </div>
       </aside>

       {/* Main Content Area */}
       <main className="flex-1 overflow-y-auto p-12 bg-white relative no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-16 pb-20">
             {activeTab === 'agency' && <AgencyProfileSection tenant={tenant!} onUpdate={updateProfile} onLogoUpload={uploadLogo} isSaving={isSaving} isAdmin={isAdmin} />}
             {activeTab === 'team' && isAdmin && <TeamMembersSection members={members} maxSeats={tenant?.max_seats || 3} onRefresh={refresh} />}
             {activeTab === 'invoice' && isAdmin && <InvoiceQuoteSection tenant={tenant!} onUpdate={updateProfile} isSaving={isSaving} />}
             {activeTab === 'bank' && isAdmin && <BankAccountsSection accounts={bankAccounts} onRefresh={refresh} tenantId={tenant?.id!} />}
             {activeTab === 'subscription' && isAdmin && <SubscriptionSection tenant={tenant!} />}
             {activeTab === 'trash' && <TrashPanel />}
          </div>
       </main>
    </div>
  );
};

// --- SUB-SECTIONS ---

const AgencyProfileSection = ({ tenant, onUpdate, onLogoUpload, isSaving, isAdmin }: any) => {
  const [formData, setFormData] = useState({ ...tenant });
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isGstinValid = !formData.gstin || gstinRegex.test(formData.gstin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGstinValid) return toast.error('Invalid GSTIN format detected');
    onUpdate(formData);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => setPreviewLogo(reader.result as string);
       reader.readAsDataURL(file);
       onLogoUpload(file);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
       <div className="flex justify-between items-end mb-12">
          <div>
             <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2 underline decoration-indigo-600 decoration-8 underline-offset-8">Agency Profile</h2>
             <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-4">Identity configuration and branding nodes</p>
          </div>
          {isAdmin && (
            <button 
              onClick={handleSubmit}
              disabled={isSaving || !isGstinValid}
              className="px-12 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic shadow-2xl flex items-center gap-3 hover:bg-black transition-all active:scale-95"
            >
              <Save className="w-4 h-4 text-emerald-400" /> {isSaving ? 'Synchronizing...' : 'Save Profile Node'}
            </button>
          )}
       </div>

       <form onSubmit={handleSubmit} className="space-y-12">
          <section className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-12">
             <div className="md:col-span-4 flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-[3rem] border-2 border-dashed border-indigo-100 flex items-center justify-center overflow-hidden relative group shadow-inner">
                   {(previewLogo || formData.logo_url) ? (
                     <img src={previewLogo || formData.logo_url} alt="Logo" className="w-full h-full object-contain p-6" />
                   ) : (
                     <Building2 className="w-16 h-16 text-slate-100" />
                   )}
                   {isAdmin && (
                     <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <label className="cursor-pointer text-white text-[10px] font-black uppercase flex flex-col items-center gap-3">
                           <Upload className="w-8 h-8 text-indigo-400" /> Upload Asset
                           <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                        </label>
                     </div>
                   )}
                </div>
                <p className="text-[8px] font-black uppercase text-slate-400 mt-6 tracking-[0.3em]">Branding Node Identification</p>
             </div>
             <div className="md:col-span-8 grid grid-cols-1 gap-8">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest italic">Legal Operational Name*</label>
                   <input 
                      disabled={!isAdmin}
                      className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-base font-black uppercase italic focus:ring-4 focus:ring-indigo-50 transition-all outline-none" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest italic">Physical Headquarters Address</label>
                   <textarea 
                      disabled={!isAdmin}
                      className="w-full p-5 bg-white border border-slate-200 rounded-[2.5rem] text-xs font-bold h-32 italic outline-none focus:ring-4 focus:ring-indigo-50 resize-none transition-all" 
                      value={formData.agency_address} 
                      onChange={e => setFormData({...formData, agency_address: e.target.value})} 
                   />
                </div>
             </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-8">
                <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-3 px-4 italic decoration-indigo-200 decoration-4 underline underline-offset-8"><Mail className="w-4 h-4" /> Transit Nodes</h3>
                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 space-y-8 shadow-sm">
                   <div>
                      <label className="text-[10px] font-black text-slate-300 uppercase mb-2 block tracking-[0.2em]">Voice Comm</label>
                      <input disabled={!isAdmin} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black tracking-widest" value={formData.agency_phone || ''} onChange={e => setFormData({...formData, agency_phone: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-300 uppercase mb-2 block tracking-[0.2em]">Neural Email</label>
                      <input disabled={!isAdmin} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black tracking-widest lowercase" value={formData.agency_email || ''} onChange={e => setFormData({...formData, agency_email: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-300 uppercase mb-2 block tracking-[0.2em]">Domain Hub</label>
                      <input disabled={!isAdmin} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black tracking-widest lowercase" placeholder="https://..." value={formData.agency_website || ''} onChange={e => setFormData({...formData, agency_website: e.target.value})} />
                   </div>
                </div>
             </div>
             <div className="space-y-8">
                <h3 className="text-[11px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-3 px-4 italic underline decoration-amber-200 decoration-4 underline-offset-8"><ShieldCheck className="w-4 h-4" /> Regulatory Keys</h3>
                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 space-y-8 shadow-sm">
                   <div>
                      <label className="text-[10px] font-black text-slate-300 uppercase mb-2 block tracking-[0.2em]">Agency GSTIN</label>
                      <input 
                        disabled={!isAdmin} 
                        className={clsx(
                          "w-full p-4 bg-slate-50 border rounded-2xl text-xs font-black tracking-[0.3em] uppercase transition-all",
                          isGstinValid ? "border-slate-100" : "border-rose-500 ring-4 ring-rose-50"
                        )} 
                        maxLength={15} 
                        value={formData.gstin || ''} 
                        onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})} 
                      />
                      {!isGstinValid && <p className="text-[8px] font-black text-rose-500 mt-2 uppercase tracking-widest">Invalid GSTIN format structure</p>}
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-300 uppercase mb-2 block tracking-[0.2em]">Agency PAN</label>
                      <input disabled={!isAdmin} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black tracking-[0.3em] uppercase" maxLength={10} value={formData.pan || ''} onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase()})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-300 uppercase mb-2 block tracking-[0.2em]">Brand Hue</label>
                      <div className="flex gap-4">
                         <input disabled={!isAdmin} type="color" className="w-14 h-14 border-none bg-transparent cursor-pointer" value={formData.primary_color || '#4f46e5'} onChange={e => setFormData({...formData, primary_color: e.target.value})} />
                         <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest font-mono italic">{formData.primary_color}</div>
                      </div>
                   </div>
                </div>
             </div>
          </section>
       </form>
    </div>
  );
};

const TeamMembersSection = ({ members, maxSeats, onRefresh }: any) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { user } = useAuth();
  const activeCount = members.filter((m: any) => m.is_active).length;

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (memberId === user?.id) return toast.error('Self-Role modification blocked');
    try {
       await settingsService.updateMember(memberId, { role: newRole as any });
       toast.success('Member hierarchy updated');
       onRefresh();
    } catch (e) {
       toast.error('Failed to adjust hierarchy');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (memberId === user?.id) return toast.error('Self-Termination blocked');
    if (!window.confirm('Terminate this personnel node connection?')) return;
    try {
       await settingsService.updateMember(memberId, { deleted_at: new Date().toISOString() } as any);
       toast.success('Personnel node disconnected');
       onRefresh();
    } catch (e) {
       toast.error('Termination sequence failed');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
       <div className="flex justify-between items-end mb-12">
          <div>
             <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2 underline decoration-indigo-600 decoration-8 underline-offset-8">Personnel Board</h2>
             <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-4">Monitoring expert nodes and clearance levels</p>
          </div>
          <button onClick={() => setIsInviteOpen(true)} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3">
             <Plus className="w-4 h-4 text-indigo-400" /> Dispatch Invitation
          </button>
       </div>

       <div className="bg-indigo-950 text-white rounded-[3rem] p-12 mb-12 flex items-center justify-between shadow-2xl relative overflow-hidden group">
          <Users className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-all duration-700" />
          <div className="flex items-center gap-8 relative z-10">
             <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 border-4 border-indigo-400/30 flex items-center justify-center font-black italic text-4xl shadow-2xl">{activeCount}</div>
             <div>
                <p className="text-lg font-black italic uppercase italic leading-none mb-2">Operational Nodes Active</p>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]">Neural Capacity: {maxSeats} Experts Authorized</p>
             </div>
          </div>
          <div className="w-48 bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/10 relative z-10">
             <div className="flex justify-between text-[8px] font-black uppercase text-indigo-200 mb-2"><span>Occupancy</span><span>{Math.round((activeCount/maxSeats)*100)}%</span></div>
             <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400" style={{ width: `${(activeCount/maxSeats)*100}%` }} />
             </div>
          </div>
       </div>

       <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
             <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                   <th className="py-6 px-10 text-left text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Personnel Expert</th>
                   <th className="py-6 px-10 text-left text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Role Clearance</th>
                   <th className="py-6 px-10 text-right text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 italic">
                {members.map((m: TeamMember) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                     <td className="py-8 px-10 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic text-xl shadow-lg shadow-slate-200 ring-4 ring-slate-50">{m.name.slice(0, 2).toUpperCase()}</div>
                        <div>
                           <p className="text-base font-black uppercase text-slate-900 leading-none mb-1.5">{m.name} {m.id === user?.id && <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full ml-2">YOU</span>}</p>
                           <p className="text-[10px] font-bold text-slate-400 tracking-tight lowercase font-mono">{m.email}</p>
                        </div>
                     </td>
                     <td className="py-8 px-10">
                        <select 
                          disabled={m.id === user?.id}
                          className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                            m.role === 'admin' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-400 border-slate-100"
                          )}
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        >
                           <option value="admin">Administrator</option>
                           <option value="staff">Operational Staff</option>
                           <option value="partner">Strategic Partner</option>
                        </select>
                     </td>
                     <td className="py-8 px-10 text-right">
                        <button 
                          onClick={() => handleRemove(m.id)}
                          disabled={m.id === user?.id}
                          className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm disabled:opacity-0"
                        ><Trash2 className="w-5 h-5" /></button>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
       <InviteMemberDrawer isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onSuccess={onRefresh} />
    </div>
  );
};

const BankAccountsSection = ({ accounts, onRefresh, tenantId }: any) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<any>(null);

  const handleSetPrimary = async (id: string) => {
    try {
       await settingsService.setPrimaryBankAccount(id, tenantId);
       toast.success('Primary liquidity hub stabilized');
       onRefresh();
    } catch (e) {
       toast.error('Balance realignment failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Purge this liquidity node?')) return;
    try {
       await settingsService.deleteBankAccount(id);
       toast.success('Node purged from registry');
       onRefresh();
    } catch (e) {
       toast.error('Decommissioning failed');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
       <div className="flex justify-between items-end mb-12">
          <div>
             <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2 underline decoration-emerald-600 decoration-8 underline-offset-8">Liquidity Nodes</h2>
             <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-4">Managing financial storage assets and primary channels</p>
          </div>
          <button onClick={() => { setEditingAcc(null); setIsFormOpen(true); }} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic shadow-2xl flex items-center gap-3">
             <Plus className="w-4 h-4 text-emerald-400" /> Register Bank Node
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {accounts.map((acc: BankAccount) => (
            <div key={acc.id} className={clsx(
              "bg-white p-10 rounded-[3.5rem] border-2 transition-all hover:shadow-2xl group relative italic",
              acc.is_primary ? "border-emerald-500 shadow-xl shadow-emerald-50" : "border-slate-100"
            )}>
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                      acc.acc_type === 'current' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                      acc.acc_type === 'upi' ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>{acc.acc_type}</div>
                    {acc.is_primary && <span className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-emerald-100">Primary Hub</span>}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => { setEditingAcc(acc); setIsFormOpen(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><Edit3 className="w-4 h-4" /></button>
                     <button onClick={() => handleDelete(acc.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
               
               <div className="space-y-2 mb-10">
                  <h4 className="text-2xl font-black uppercase italic text-slate-950 tracking-tighter leading-tight">{acc.account_name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase italic tracking-widest">{acc.bank_name}</p>
                  <p className="text-sm font-black text-slate-900 mt-4 tracking-[0.2em] font-mono">**** **** **** {acc.account_number?.slice(-4) || 'NULL'}</p>
               </div>

               <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-300 uppercase mb-1 tracking-[0.2em]">Liquid Value (INR)</p>
                    <p className="text-3xl font-black italic text-slate-950 tracking-tighter">{formatINR(acc.running_balance)}</p>
                  </div>
                  {!acc.is_primary && (
                    <button 
                      onClick={() => handleSetPrimary(acc.id)}
                      className="text-[9px] font-black uppercase text-indigo-600 hover:underline underline-offset-8 decoration-2 italic"
                    >Set as Primary Node</button>
                  )}
               </div>
            </div>
          ))}
          
          <button 
            onClick={() => { setEditingAcc(null); setIsFormOpen(true); }}
            className="h-full min-h-[300px] bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3.5rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-500 transition-all group"
          >
             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Plus className="w-8 h-8" /></div>
             <p className="text-xs font-black uppercase tracking-[0.3em] italic">Initialize New Asset Node</p>
          </button>
       </div>
       <AddBankAccountDrawer isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={onRefresh} initialData={editingAcc} />
    </div>
  );
};

const InvoiceQuoteSection = ({ tenant, onUpdate, isSaving }: any) => {
  const [formData, setFormData] = useState({ ...tenant });
  
  const nextInvNum = `${formData.invoice_prefix}-${new Date().getFullYear()}-${String(formData.invoice_next_num).padStart(4, '0')}`;
  const nextQuoteNum = `${formData.quote_prefix}-${new Date().getFullYear()}-${String(formData.quote_next_num).padStart(4, '0')}`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
       <div className="flex justify-between items-end mb-12">
          <div>
             <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2 underline decoration-indigo-600 decoration-8 underline-offset-8">Financial Protocol</h2>
             <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-4">Configuring sequence logic and transaction footers</p>
          </div>
          <button onClick={() => onUpdate(formData)} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3">
             <Save className="w-4 h-4 text-emerald-400" /> Commit Sequence logic
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
             <div className="flex items-center gap-3 px-6 italic">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm"><FileText className="w-5 h-5 text-indigo-600" /></div>
                <div>
                   <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Billing Logic</h3>
                   <p className="text-[8px] font-black uppercase text-slate-300">Automated Invoice Sequence</p>
                </div>
             </div>
             <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 space-y-10 shadow-sm">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Protocol Prefix</label>
                   <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black uppercase italic tracking-widest focus:ring-4 focus:ring-indigo-50 outline-none transition-all" maxLength={5} value={formData.invoice_prefix} onChange={e => setFormData({...formData, invoice_prefix: e.target.value.toUpperCase()})} />
                   <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 italic">
                      <p className="text-[8px] font-black uppercase text-indigo-400 mb-1">Generated Output Instance</p>
                      <p className="text-sm font-black text-indigo-900">{nextInvNum}</p>
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Account Registry Footer</label>
                   <textarea className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-xs font-bold h-40 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all italic resize-none" value={formData.invoice_bank_text} onChange={e => setFormData({...formData, invoice_bank_text: e.target.value})} placeholder="Acc Node: XYZ Travels..." />
                </div>
             </div>
          </div>

          <div className="space-y-8">
             <div className="flex items-center gap-3 px-6 italic">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm"><FileText className="w-5 h-5 text-amber-600" /></div>
                <div>
                   <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Quotation Logic</h3>
                   <p className="text-[8px] font-black uppercase text-slate-300">Operational Proposal Pipeline</p>
                </div>
             </div>
             <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 space-y-10 shadow-sm">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Protocol Prefix</label>
                   <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black uppercase italic tracking-widest focus:ring-4 focus:ring-amber-50 outline-none transition-all" maxLength={5} value={formData.quote_prefix} onChange={e => setFormData({...formData, quote_prefix: e.target.value.toUpperCase()})} />
                   <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 italic">
                      <p className="text-[8px] font-black uppercase text-amber-500 mb-1">Generated Output Instance</p>
                      <p className="text-sm font-black text-amber-900">{nextQuoteNum}</p>
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Default Validity Window (Days)</label>
                   <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-black italic focus:ring-4 focus:ring-amber-50 outline-none transition-all" value={formData.quote_validity} onChange={e => setFormData({...formData, quote_validity: parseInt(e.target.value) || 1})} />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const SubscriptionSection = ({ tenant }: any) => {
  const isTrial = tenant.subscription_status === 'trial';
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
       <div className="mb-12">
          <h2 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2 underline decoration-slate-900 decoration-8 underline-offset-8">Neural License</h2>
          <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-4">Subscription parameters and multi-tenant resource quota</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4 rounded-[3.5rem] bg-indigo-950 text-white p-12 flex flex-col justify-between overflow-hidden relative shadow-2xl group italic">
             <CreditCard className="absolute -right-8 -bottom-8 w-64 h-64 text-white opacity-5 group-hover:rotate-12 transition-all duration-700" />
             <div className="relative z-10 space-y-8">
                <div>
                   <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-4 italic leading-none">Access Level Hub</p>
                   <h3 className="text-5xl font-black italic uppercase italic leading-none mb-6 tracking-tighter">{tenant.plan || 'Free Core'}</h3>
                   <span className={clsx(
                     "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border shadow-lg italic",
                     isTrial ? "bg-amber-400/20 text-amber-400 border-amber-400/20" : "bg-emerald-400/20 text-emerald-400 border-emerald-400/20"
                   )}>{tenant.subscription_status} NODE STABILIZED</span>
                </div>
                
                <div className="pt-10 border-t border-white/5 space-y-6">
                   <div>
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest uppercase mb-1 leading-none italic">SLA Termination Sequence</p>
                      <p className="text-base font-black italic text-indigo-100">{tenant.trial_end ? new Date(tenant.trial_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Infinite Pulse License'}</p>
                   </div>
                   <button className="w-full py-5 bg-white text-indigo-950 rounded-[2rem] text-[10px] font-black uppercase italic tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                      Upgrade Neural Quota
                   </button>
                </div>
             </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-4 italic h-fit">
             {['Leads Node', 'Customer Registry', 'Proposal Engine', 'Financial Billing', 'Operational Bookings', 'Itinerary Matrix', 'Visa Pipelines', 'Task Scheduler', 'Team Hierarchy', 'Audit Logs', 'API V2 Nodes', 'Priority SLA'].map(f => (
               <div key={f} className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-indigo-100 transition-all shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-white text-emerald-500 border border-emerald-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm"><Check className="w-5 h-5" /></div>
                  <span className="text-[10px] font-black uppercase text-slate-950 group-hover:text-indigo-900 tracking-tighter leading-none italic">{f}</span>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
};
