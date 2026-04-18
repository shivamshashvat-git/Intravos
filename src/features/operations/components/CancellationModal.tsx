import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calculator, RefreshCw, Info } from 'lucide-react';
import { formatINR } from '@/utils/currency';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  booking: any;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({ isOpen, onClose, onConfirm, booking }) => {
  const [data, setData] = useState({
    reason: 'customer_request',
    notes: '',
    refundStatus: 'pending',
    refundDueToClient: 0,
    supplierRefundDue: 0,
    supplierRefundReceived: 0,
    agencyCancellationLoss: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-calculation logic
  useEffect(() => {
    const collected = Number(booking.amount_collected || 0);
    const refundToClient = Number(data.refundDueToClient || 0);
    const supplierRefund = Number(data.supplierRefundReceived || 0);
    
    // Formula: collected - refundToClient - supplierRefundReceived
    // Actually, if we collect 100, refund 80 to client, but supplier refunds 0 to us, we loss 20 (collected-refundToClient).
    // Loss = (Collected - RefundToClient) - (CostPaid - SupplierRefundReceived)
    // For simplicity as per prompt: amount_collected - refund_due_to_client - supplier_refund_received
    // Wait, the prompt says Loss = amount_collected - refund_due_to_client - supplier_refund_received? 
    // Usually Loss is money we had and now don't, or margin we lost.
    // If we collected 100, we refund 80. Net retained = 20. If we paid supplier 50 and they refund 0, our loss is 30.
    // Let's stick to prompt's suggested formula but keep it editable.
    const loss = collected - refundToClient - supplierRefund;
    setData(prev => ({ ...prev, agencyCancellationLoss: loss }));
  }, [data.refundDueToClient, data.supplierRefundReceived, booking.amount_collected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await onConfirm(data);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" onClick={onClose}></div>
       <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
             <div className="px-8 py-6 bg-red-50 border-b border-red-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black italic uppercase text-red-700 flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5" /> Cancel Booking
                   </h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Voiding Ref: {booking.booking_number}</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-red-100 rounded-full text-red-300 transition-colors"><X className="w-5 h-5" /></button>
             </div>

             <div className="p-8 space-y-6">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Cancellation Trigger</label>
                   <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-red-500" value={data.reason} onChange={e => setData({...data, reason: e.target.value})}>
                      <option value="customer_request">Customer Request (Change of Plans)</option>
                      <option value="visa_rejection">Visa Rejection</option>
                      <option value="medical_emergency">Medical Emergency</option>
                      <option value="natural_disaster">Natural Disaster / Acts of God</option>
                      <option value="supplier_failure">Supplier / Service Failure</option>
                      <option value="pricing_dispute">Pricing / Service Dispute</option>
                      <option value="other">Other / Unspecified</option>
                   </select>
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Internal Narrative</label>
                   <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium h-24 outline-none focus:bg-white" placeholder="Why is this being cancelled? Add detail for audit..." value={data.notes} onChange={e => setData({...data, notes: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Refund Status</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none" value={data.refundStatus} onChange={e => setData({...data, refundStatus: e.target.value})}>
                         <option value="pending">Refund Pending</option>
                         <option value="partial">Partial Refunded</option>
                         <option value="full">Fully Refunded</option>
                         <option value="none">No Refund Applicable</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Refund to Client (₹)</label>
                      <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none" value={data.refundDueToClient} onChange={e => setData({...data, refundDueToClient: parseFloat(e.target.value) || 0})} />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Supplier Refund Due (₹)</label>
                      <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none" value={data.supplierRefundDue} onChange={e => setData({...data, supplierRefundDue: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Supplier Refund Received (₹)</label>
                      <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none" value={data.supplierRefundReceived} onChange={e => setData({...data, supplierRefundReceived: parseFloat(e.target.value) || 0})} />
                   </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                   <Calculator className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                   <div className="relative z-10 flex justify-between items-end">
                      <div>
                         <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Agency Net Loss (Estimated)</p>
                         <h4 className="text-xl font-black italic text-red-400 leading-none">{formatINR(data.agencyCancellationLoss)}</h4>
                      </div>
                      <p className="text-[8px] font-bold text-white/30 text-right max-w-[120px] leading-tight flex items-center gap-1">
                         <Info className="w-2 h-2" /> Collected - RefundToClient - SupplierRefund
                      </p>
                   </div>
                </div>
             </div>

             <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight italic">⚠️ This action cannot be undone</span>
                <div className="flex items-center gap-3">
                   <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold text-slate-400">Cancel</button>
                   <button 
                     type="submit" 
                     disabled={isProcessing}
                     className="px-8 py-3 bg-red-600 text-white font-black rounded-xl text-xs uppercase italic shadow-xl shadow-red-100 flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95"
                   >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Cancellation'}
                   </button>
                </div>
             </div>
          </form>
       </div>
    </div>
  );
};
