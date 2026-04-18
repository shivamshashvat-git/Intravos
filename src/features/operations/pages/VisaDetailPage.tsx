import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Globe, User, ShieldCheck, Clock, 
  MapPin, Calendar, CreditCard, FileText, 
  Trash2, Download, AlertCircle, CheckCircle2,
  XCircle, ChevronRight, Hash, Phone, Building,
  Navigation, Plane, Landmark, Briefcase, Camera,
  Banknote, Shield, Receipt, MoreVertical, Edit2
} from 'lucide-react';
import { useVisa } from '../hooks/useVisa';
import { formatINR } from '@/utils/currency';
import { timeAgo } from '@/utils/time';
import { VisaStatus, PassportCustody, VisaDocumentType } from '../types/visa';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const VisaDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    visa, isLoading, error, updateStatus, updateCustody, 
    updateFinancials, uploadDoc, deleteDoc, updateNotes 
  } = useVisa(id!);

  const [isUploading, setIsUploading] = useState(false);

  if (isLoading || !visa) return <div className="h-screen flex items-center justify-center font-black italic text-slate-300 uppercase tracking-[0.3em]">Hydrating Visa Node...</div>;

  const isPassportExpired = visa.passport_expiry && new Date(visa.passport_expiry) < new Date();
  const isPassportExpiringSoon = visa.passport_expiry && new Date(visa.passport_expiry).getTime() - Date.now() < 180 * 86400000;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: VisaDocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadDoc(file, type);
      toast.success(`${type.replace(/_/g, ' ')} Uploaded`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto px-4">
      {/* Header Section */}
      <section className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-12 italic">
         <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -mr-40 -mt-40 -z-10" />
         
         <div className="space-y-10 flex-1">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate('/visa')} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
               <div className="flex items-center gap-4">
                  <span className="text-xl font-mono font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full italic tracking-tighter">APP-VISE-{visa.id.slice(0, 5).toUpperCase()}</span>
                  <StatusBadge status={visa.status} />
                  <CustodyBadge custody={visa.passport_custody} />
               </div>
            </div>

            <div>
               <div className="flex items-baseline gap-4 mb-4">
                  <h1 className="text-6xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">{visa.traveler_name}</h1>
                  <span className="text-3xl font-black text-slate-200">/</span>
                  <p className="text-2xl font-black italic text-slate-400 uppercase tracking-tighter">
                     {visa.visa_country}
                  </p>
               </div>
               
               <div className="flex flex-wrap gap-8 items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"><Hash className="w-5 h-5" /></div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Passport Node</p>
                        <p className={clsx("text-sm font-black italic uppercase text-slate-900", isPassportExpired ? "text-rose-500" : "text-slate-900")}>
                           {maskIdentifier(visa.passport_number)} 
                           {isPassportExpiringSoon && <span className="ml-2 text-[9px] text-rose-500 animate-pulse">(Expiring Soon)</span>}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 border-l border-slate-100 pl-8">
                     <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><Plane className="w-5 h-5" /></div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Visa Config</p>
                        <p className="text-sm font-black italic uppercase text-slate-900">{visa.visa_type} • {visa.entry_type}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 border-l border-slate-100 pl-8">
                     <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Target Window</p>
                        <p className="text-sm font-black italic uppercase text-slate-900">{visa.travel_date ? new Date(visa.travel_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-end justify-between min-w-[340px]">
            <div className="text-right space-y-3">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Operational Flow Control</p>
               <div className="flex flex-col gap-3">
                  <StatusController status={visa.status} onUpdate={updateStatus} />
                  <CustodyController custody={visa.passport_custody} onUpdate={updateCustody} />
               </div>
            </div>
            
            <div className="flex gap-4 pt-10">
               <button className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm"><Download className="w-5 h-5" /></button>
               <button className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm group relative">
                  <MoreVertical className="w-5 h-5" />
               </button>
            </div>
         </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-12">
         {/* Left Column: Logic & Documents */}
         <div className="col-span-12 lg:col-span-8 space-y-12">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic">
               {/* Application Metadata Card */}
               <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl space-y-8">
                  <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                     <FileText className="w-4 h-4 text-indigo-500" /> Pipeline Metadata
                  </h3>
                  <div className="space-y-6">
                     <MetaRow label="VFS CENTER" val={visa.vfs_center || 'UNMAPPED'} />
                     <MetaRow label="APPOINTMENT" val={visa.vfs_appointment_date ? new Date(visa.vfs_appointment_date).toLocaleString() : 'UNSCHEDULED'} urgent={isUrgent(visa.vfs_appointment_date)} />
                     <MetaRow label="VFS REFERENCE" val={visa.vfs_reference_number || 'NONE'} copy />
                     <MetaRow label="EMBASSY REF" val={visa.embassy_reference || 'NONE'} copy />
                     <MetaRow label="EXPECTED SLA" val={visa.expected_decision_date || 'TBD'} />
                  </div>
                  
                  {visa.status === 'approved' && (
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-2">
                       <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">VISA GRANTED</p>
                       <div className="flex justify-between items-baseline">
                          <h4 className="text-xl font-black italic uppercase text-emerald-700">{visa.visa_number}</h4>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase">EXP: {visa.visa_expiry}</p>
                       </div>
                    </div>
                  )}

                  {visa.status === 'rejected' && (
                    <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-2">
                       <p className="text-[8px] font-black uppercase text-rose-600 tracking-widest">VISA REJECTED</p>
                       <p className="text-sm font-bold italic text-rose-700">{visa.rejection_reason}</p>
                    </div>
                  )}
               </div>

               {/* Return Tracking Card */}
               {(visa.status === 'approved' || visa.status === 'rejected' || visa.passport_custody === 'returned_to_client') && (
                 <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8">
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                       <Navigation className="w-4 h-4 text-indigo-500" /> Post-Decision Logistics
                    </h3>
                    <div className="space-y-6">
                       <MetaRow label="DISPATCHED" val={visa.passport_dispatched_date || 'PENDING'} />
                       <MetaRow label="COURIER HUB" val={visa.passport_courier_name || 'UNMAPPED'} />
                       <MetaRow label="TRACKING ID" val={visa.passport_tracking_number || 'NONE'} copy />
                       <MetaRow label="RECEIVED BY CLI" val={visa.passport_received_date || 'NOT RETURNED'} />
                    </div>
                    {visa.passport_custody !== 'returned_to_client' && (
                       <button 
                         onClick={() => updateCustody('returned_to_client')}
                         className="w-full py-4 bg-white border border-slate-200 text-indigo-600 rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-sm hover:scale-105 transition-all"
                       >
                          Finalize Return Protocol
                       </button>
                    )}
                 </div>
               )}
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl">
               <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <div>
                    <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3 italic">
                       <Briefcase className="w-4 h-4 text-indigo-500" /> Digital Document Vault
                    </h3>
                    <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-widest italic">{visa.documents?.length || 0} Segment(s) Encrypted</p>
                  </div>
                  <div className="flex gap-4">
                     <label className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic cursor-pointer hover:bg-black transition-all flex items-center gap-2">
                        <ArrowUp className="w-3 h-3" /> Upload Segment
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'other')} />
                     </label>
                  </div>
               </div>

               <div className="p-8">
                  {/* Checklist Summary */}
                  <div className="flex flex-wrap gap-4 mb-10">
                     <ChecklistBadge label="Passport Copy" checked={hasDoc(visa, 'passport_copy')} />
                     <ChecklistBadge label="Biometric Photo" checked={hasDoc(visa, 'photo')} />
                     <ChecklistBadge label="Bank Node" checked={hasDoc(visa, 'bank_statement')} />
                     <ChecklistBadge label="Flight PNR" checked={hasDoc(visa, 'flight_booking')} />
                     <ChecklistBadge label="Hotel Node" checked={hasDoc(visa, 'hotel_booking')} />
                  </div>

                  <div className="space-y-4">
                     {(visa.documents || []).length === 0 ? (
                       <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] italic text-slate-200 text-[10px] font-black uppercase tracking-[0.5em]">No data segments detected</div>
                     ) : (
                       visa.documents?.map(doc => (
                         <div key={doc.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl group italic hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                            <div className="flex items-center gap-6">
                               <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-all shadow-sm shadow-slate-100/50">
                                  <DocIcon type={doc.document_type} />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase text-indigo-400 tracking-tighter leading-none mb-1">{doc.document_type.replace(/_/g, ' ')} node</p>
                                  <h4 className="text-sm font-black text-slate-900 uppercase leading-none">{doc.document_name}</h4>
                                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{formatSize(doc.file_size)} • {timeAgo(doc.uploaded_at)}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                               <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all"><Download className="w-4 h-4" /></a>
                               <button onClick={() => deleteDoc(doc.id, doc.file_url.split('/').slice(-3).join('/'))} className="p-2.5 text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-6">
               <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] italic flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" /> Operational Directive Log
               </h3>
               <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <Landmark className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-all duration-700" />
                  <textarea 
                     className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-sm font-bold italic text-white/90 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all h-[240px]"
                     placeholder="Log sensitive handling protocols, embassy feedback, or counselor notes..."
                     defaultValue={visa.notes || ''}
                     onBlur={(e) => updateNotes(e.target.value)}
                  />
                  <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/30 italic">
                     <span>Restricted Personnel Access Only</span>
                     <span>Auto-commit on blur enabled</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Meta & Financials */}
         <div className="col-span-12 lg:col-span-4 space-y-12 italic">
            {/* Financial Summary */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <Wallet className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-5" />
               <h3 className="text-[11px] font-black uppercase text-white/30 tracking-[0.2em] mb-10 relative z-10">Monetary Pipeline Breakdown</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center group cursor-pointer" onClick={() => {
                     const val = prompt('New Visa Fee:', String(visa.visa_fee));
                     if (val) updateFinancials({ visa_fee: Number(val) });
                  }}>
                     <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Consulate Fee</span>
                     <span className="text-xl font-black italic tracking-tighter flex items-center gap-3 group-hover:text-indigo-400 transition-colors uppercase italic">{formatINR(visa.visa_fee)} <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" /></span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer" onClick={() => {
                     const val = prompt('New Agency Charge:', String(visa.service_charge));
                     if (val) updateFinancials({ service_charge: Number(val) });
                  }}>
                     <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Agency Surplus</span>
                     <span className="text-xl font-black italic tracking-tighter flex items-center gap-3 group-hover:text-amber-400 transition-colors uppercase italic">{formatINR(visa.service_charge)} <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" /></span>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em]">Node Revenue</span>
                     <span className="text-4xl font-black italic tracking-tighter text-indigo-400 italic">{formatINR(visa.total_amount)}</span>
                  </div>
               </div>
            </div>

            {/* System Status History (Pseudo Timeline) */}
            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl space-y-8">
               <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Deployment History</h3>
               <div className="space-y-8 relative">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100 border-dashed border-l" />
                  <HistoryItem label="Current Operational Pivot" status={visa.status} date={visa.updated_at} active />
                  {visa.submitted_at && <HistoryItem label="Embassy Submission Node" date={visa.submitted_at} />}
                  <HistoryItem label="Blueprint Initialized" date={visa.created_at} />
               </div>
            </div>

            {/* User Meta Card */}
            <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 space-y-8">
               <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Node Identity</h3>
               <div className="space-y-6">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Legal Identity</label>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group">
                       <span className="text-xs font-black uppercase text-slate-900 line-clamp-1">{visa.traveler_name}</span>
                       <User className="w-3.5 h-3.5 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Comm Channel (Direct)</label>
                    <a href={`tel:${visa.traveler_phone}`} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-600 transition-all">
                       <span className="text-xs font-black uppercase text-indigo-600 underline underline-offset-4">{visa.traveler_phone || 'NO_CONTACT'}</span>
                       <Phone className="w-3.5 h-3.5 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                    </a>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Linked Operational Hub</label>
                    {visa.booking ? (
                      <Link to={`/bookings/${visa.booking.id}`} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-emerald-600 transition-all">
                         <span className="text-xs font-black uppercase text-slate-950 font-mono italic">{visa.booking.booking_number}</span>
                         <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-emerald-600 transition-colors" />
                      </Link>
                    ) : (
                      <div className="p-4 bg-slate-100/50 rounded-2xl text-[9px] font-black uppercase text-slate-300 tracking-widest">Isolated Application</div>
                    )}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Sub-components & Helpers ---

const StatusBadge = ({ status }: { status: VisaStatus }) => {
  const map: Record<VisaStatus, { label: string, color: string }> = {
    documents_pending: { label: 'PENDING DOCS', color: 'bg-rose-50 text-rose-500 border-rose-100' },
    documents_received: { label: 'DOCS STABILIZED', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    submitted_to_embassy: { label: 'ENVOY SUBMITTED', color: 'bg-blue-50 text-blue-500 border-blue-100' },
    under_processing: { label: 'UNDER PROCESSING', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    approved: { label: 'VISA GRANTED', color: 'bg-emerald-500 text-white border-transparent shadow-emerald-100 shadow-lg animate-pulse' },
    rejected: { label: 'VISA DENIED', color: 'bg-rose-600 text-white border-transparent shadow-rose-100 shadow-lg' },
    cancelled: { label: 'TERMINATED', color: 'bg-slate-100 text-slate-400 border-transparent' },
  };
  const theme = map[status];
  return (
    <span className={clsx("px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic tracking-widest border border-transparent shadow-sm", theme.color)}>
      {theme.label}
    </span>
  );
};

const CustodyBadge = ({ custody }: { custody: PassportCustody }) => {
  const map: Record<PassportCustody, { label: string, color: string }> = {
    with_client: { label: 'CLIENT CUSTODY', color: 'bg-slate-50 text-slate-400' },
    with_agency: { label: 'AGENCY SECURED', color: 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' },
    submitted_to_vfs: { label: 'VFS CUSTODY', color: 'bg-amber-500 text-white shadow-xl shadow-amber-100' },
    submitted_to_embassy: { label: 'EMBASSY SECURED', color: 'bg-amber-600 text-white shadow-xl shadow-amber-200' },
    returned_to_client: { label: 'OPERATIONAL RETURN', color: 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' },
  };
  const theme = map[custody];
  return (
    <span className={clsx("px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic tracking-widest border border-transparent flex items-center gap-2", theme.color)}>
      <Lock className="w-3.5 h-3.5" /> {theme.label}
    </span>
  );
};

const MetaRow = ({ label, val, copy, urgent }: { label: string, val: string, copy?: boolean, urgent?: boolean }) => (
  <div className="flex justify-between items-baseline group">
     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
     <div className="flex items-center gap-3">
        {copy && <button onClick={() => { navigator.clipboard.writeText(val); toast.success('Key Captured'); }} className="opacity-0 group-hover:opacity-100 transition-all"><Hash className="w-3 h-3 text-indigo-400" /></button>}
        <span className={clsx("text-sm font-black italic uppercase tracking-tighter transition-colors", urgent ? "text-rose-500 animate-pulse" : "text-slate-900 group-hover:text-indigo-600")}>{val}</span>
     </div>
  </div>
);

const ChecklistBadge = ({ label, checked }: { label: string, checked: boolean }) => (
  <div className={clsx(
    "px-4 py-2 rounded-2xl flex items-center gap-3 border transition-all",
    checked ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm" : "bg-slate-50 border-slate-100 text-slate-300 grayscale"
  )}>
     {checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
     <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

const HistoryItem = ({ label, date, status, active }: any) => (
  <div className="relative pl-10">
     <div className={clsx(
       "absolute left-2.5 top-0 w-3 h-3 rounded-full border-2 border-white ring-4 ring-white shadow-sm transition-all",
       active ? "bg-indigo-600 scale-125" : "bg-slate-200"
     )} />
     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">{label}</p>
     <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-900 italic uppercase italic tracking-tighter line-clamp-1">{status ? status.replace(/_/g, ' ') : 'SEQUENCE CHECKPOINT'}</span>
        <span className="text-[9px] font-bold text-slate-300 italic uppercase">{new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
     </div>
  </div>
);

const StatusController = ({ status, onUpdate }: any) => {
   const options: Record<VisaStatus, any> = {
      documents_pending: { next: 'Mark Docs Stabilized', value: 'documents_received' },
      documents_received: { next: 'Initiate Embassy Mission', value: 'submitted_to_embassy' },
      submitted_to_embassy: { next: 'Mark Under Processing', value: 'under_processing' },
      under_processing: { next: 'Grant Visa', value: 'approved' },
      approved: { next: 'Resolve Protocol', value: 'cancelled' },
      rejected: { next: 'Terminate Pipeline', value: 'cancelled' },
      cancelled: { next: 'Reset Pipeline', value: 'documents_pending' },
   };
   
   const current = options[status as VisaStatus] || options.documents_pending;

   return (
     <div className="flex flex-col gap-2">
        <button 
           onClick={() => {
              if (current.value === 'approved') {
                 const num = prompt('Enter Visa Number:');
                 const exp = prompt('Enter Expiry Date (YYYY-MM-DD):');
                 if (num && exp) onUpdate('approved', { visa_number: num, visa_expiry: exp });
              } else if (current.value === 'rejected') {
                 const reason = prompt('Rejection Reason:');
                 if (reason) onUpdate('rejected', { rejection_reason: reason });
              } else {
                 onUpdate(current.value);
              }
           }}
           className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black italic uppercase text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all outline outline-offset-4 outline-indigo-100"
        >
           {current.next}
        </button>
        {status === 'under_processing' && <button onClick={() => {
           const r = prompt('Rejection Intel:');
           if (r) onUpdate('rejected', { rejection_reason: r });
        }} className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] italic hover:underline">Mark Denied</button>}
     </div>
   );
};

const CustodyController = ({ custody, onUpdate }: any) => {
   const workflow: PassportCustody[] = ['with_client', 'with_agency', 'submitted_to_vfs', 'submitted_to_embassy', 'returned_to_client'];
   return (
     <select 
       className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[9px] font-black uppercase tracking-widest italic outline-none text-slate-400 hover:text-indigo-600 transition-colors"
       value={custody}
       onChange={(e) => onUpdate(e.target.value)}
     >
        {workflow.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ').toUpperCase()}</option>)}
     </select>
   );
};

const DocIcon = ({ type }: { type: VisaDocumentType }) => {
   switch (type) {
      case 'passport_copy': return <Landmark className="w-5 h-5" />;
      case 'photo': return <Camera className="w-5 h-5" />;
      case 'bank_statement': return <Banknote className="w-5 h-5" />;
      case 'flight_booking': return <Plane className="w-5 h-5" />;
      case 'hotel_booking': return <Building className="w-5 h-5" />;
      case 'insurance': return <Shield className="w-5 h-5" />;
      case 'itr': return <Receipt className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
   }
};

const maskIdentifier = (id?: string | null) => {
   if (!id) return 'UNMAPPED';
   return id.slice(0, 2) + '****' + id.slice(-2);
};

const formatSize = (bytes?: number | null) => {
   if (!bytes) return '0 KB';
   const kb = bytes / 1024;
   if (kb < 1024) return `${Math.round(kb)} KB`;
   return `${(kb / 1024).toFixed(1)} MB`;
};

const isUrgent = (date?: string | null) => {
   if (!date) return false;
   return new Date(date).getTime() - Date.now() < 3 * 86400000;
};

const hasDoc = (visa: any, type: string) => visa.documents?.some((d: any) => d.document_type === type);

const ArrowUp = (props: any) => <FileText {...props} />;
