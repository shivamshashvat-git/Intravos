import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { leadsService } from '@/features/crm/services/leadsService';
import { useAuth } from '@/core/hooks/useAuth';
import { Lead, LeadSource, LeadPriority } from '@/features/crm/types/lead';
import { supabase } from '@/core/lib/supabase';

interface EditLeadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess: (updatedLead: Lead) => void;
}

export const EditLeadDrawer: React.FC<EditLeadDrawerProps> = ({ isOpen, onClose, lead, onSuccess }) => {
  const { tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);

  const [formData, setFormData] = useState({
    customer_name: lead.customer_name,
    customer_phone: lead.customer_phone,
    customer_email: lead.customer_email || '',
    destination: lead.destination || '',
    travel_start_date: lead.travel_start_date || '',
    checkin_date: lead.checkin_date || '',
    checkout_date: lead.checkout_date || '',
    guests: lead.guests,
    rooms: lead.rooms,
    source: lead.source,
    priority: lead.priority,
    assigned_to: lead.assigned_to || '',
    budget: lead.budget,
    selling_price: lead.selling_price,
    cost_price: lead.cost_price,
    amount_collected: lead.amount_collected,
    internal_notes: lead.internal_notes || ''
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchUsers();
      setFormData({
        customer_name: lead.customer_name,
        customer_phone: lead.customer_phone,
        customer_email: lead.customer_email || '',
        destination: lead.destination || '',
        travel_start_date: lead.travel_start_date || '',
        checkin_date: lead.checkin_date || '',
        checkout_date: lead.checkout_date || '',
        guests: lead.guests,
        rooms: lead.rooms,
        source: lead.source,
        priority: lead.priority,
        assigned_to: lead.assigned_to || '',
        budget: lead.budget,
        selling_price: lead.selling_price,
        cost_price: lead.cost_price,
        amount_collected: lead.amount_collected,
        internal_notes: lead.internal_notes || ''
      });
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, lead]);

  const fetchUsers = async () => {
    if (!tenant?.id) return;
    const { data } = await supabase
      .from('users')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true);
    if (data) setUsers(data);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.customer_name) errors.customer_name = 'Required';
    if (!formData.customer_phone) errors.customer_phone = 'Required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedLead = await leadsService.updateLead(lead.id, {
        ...formData,
        budget: Number(formData.budget),
        selling_price: Number(formData.selling_price),
        cost_price: Number(formData.cost_price),
        amount_collected: Number(formData.amount_collected),
        travel_start_date: formData.travel_start_date || null,
        checkin_date: formData.checkin_date || null,
        checkout_date: formData.checkout_date || null,
      });

      onSuccess(updatedLead);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Lead</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="edit-lead-form" onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 px-1">Contact & Trip</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  placeholder="Name"
                  value={formData.customer_name}
                  onChange={e => setFormData({...formData, customer_name: e.target.value})}
                />
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  placeholder="Phone"
                  value={formData.customer_phone}
                  onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                />
                <input 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  placeholder="Destination"
                  value={formData.destination}
                  onChange={e => setFormData({...formData, destination: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" className="px-4 py-2 border rounded-lg" value={formData.travel_start_date} onChange={e => setFormData({...formData, travel_start_date: e.target.value})} />
                  <select className="px-4 py-2 border rounded-lg" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 px-1">Financials</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400">Budget</label>
                    <input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.budget} onChange={e => setFormData({...formData, budget: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400">Final Price</label>
                    <input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400">Vendor Cost</label>
                    <input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400">Amount Collected</label>
                    <input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.amount_collected} onChange={e => setFormData({...formData, amount_collected: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
            </section>

             <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 px-1">Internal Notes</h3>
              <textarea 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 h-32 focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="Private notes for team members..."
                value={formData.internal_notes}
                onChange={e => setFormData({...formData, internal_notes: e.target.value})}
              />
            </section>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-600">Cancel</button>
          <button 
            type="submit" 
            form="edit-lead-form"
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
