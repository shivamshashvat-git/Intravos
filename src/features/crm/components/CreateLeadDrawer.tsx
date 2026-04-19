import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { leadsService } from '@/features/crm/services/leadsService';
import { useAuth } from '@/core/hooks/useAuth';
import { Lead, LeadSource, LeadPriority } from '@/features/crm/types/lead';
import { apiClient } from '@/core/lib/apiClient';

interface CreateLeadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead: Lead) => void;
}

export const CreateLeadDrawer: React.FC<CreateLeadDrawerProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string, name: string }[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    destination: '',
    travel_start_date: '',
    checkin_date: '',
    checkout_date: '',
    guests: 1,
    rooms: 1,
    source: 'manual' as LeadSource,
    priority: 'normal' as LeadPriority,
    assigned_to: user?.id || '',
    budget: 0
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchUsers();
      // Reset form
      setFormData({
        ...formData,
        assigned_to: user?.id || ''
      });
      setFieldErrors({});
      setError(null);
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, user]);

  const fetchUsers = async () => {
    if (!tenant?.id) return;
    try {
      const res = await apiClient(`/api/system/users`);
      if (res.ok) {
        const result = await res.json();
        setUsers(result.data?.users || result.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.customer_name || formData.customer_name.length < 2) {
      errors.customer_name = 'Name must be at least 2 characters';
    }
    if (!formData.customer_phone || formData.customer_phone.length < 10) {
      errors.customer_phone = 'Valid phone number is required';
    }
    if (!formData.source) {
      errors.source = 'Source is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!tenant?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const newLead = await leadsService.createLead({
        ...formData,
        tenant_id: tenant.id,
        status: 'new',
        budget: Number(formData.budget) || 0,
        guests: Number(formData.guests) || 1,
        rooms: Number(formData.rooms) || 1,
        // Ensure empty dates are null
        travel_start_date: formData.travel_start_date || null,
        checkin_date: formData.checkin_date || null,
        checkout_date: formData.checkout_date || null,
        customer_email: formData.customer_email || null,
        destination: formData.destination || null
      });

      onSuccess(newLead);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Add New Lead</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="create-lead-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Details */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 px-1">Contact Details</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name*</label>
                    <input 
                      type="text"
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all ${fieldErrors.customer_name ? 'border-red-300' : 'border-slate-200'}`}
                      placeholder="e.g. Rahul Sharma"
                      value={formData.customer_name}
                      onChange={e => setFormData({...formData, customer_name: e.target.value})}
                    />
                    {fieldErrors.customer_name && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.customer_name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number*</label>
                      <input 
                        type="tel"
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all ${fieldErrors.customer_phone ? 'border-red-300' : 'border-slate-200'}`}
                        placeholder="+91 98765 43210"
                        value={formData.customer_phone}
                        onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                      />
                      {fieldErrors.customer_phone && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.customer_phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input 
                        type="email"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                        placeholder="rahul@example.com"
                        value={formData.customer_email}
                        onChange={e => setFormData({...formData, customer_email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Trip Details */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 px-1">Trip Details</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    placeholder="e.g. Maldives, Europe"
                    value={formData.destination}
                    onChange={e => setFormData({...formData, destination: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Travel Start Date</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      value={formData.travel_start_date}
                      onChange={e => setFormData({...formData, travel_start_date: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Check-in</label>
                      <input 
                        type="date"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                        value={formData.checkin_date}
                        onChange={e => setFormData({...formData, checkin_date: e.target.value})}
                      />
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Check-out</label>
                      <input 
                        type="date"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                        value={formData.checkout_date}
                        onChange={e => setFormData({...formData, checkout_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. of Guests</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      value={formData.guests}
                      onChange={e => setFormData({...formData, guests: parseInt(e.target.value) || 1})}
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. of Rooms</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      value={formData.rooms}
                      onChange={e => setFormData({...formData, rooms: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Lead Info */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4 px-1">Lead Info</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Source*</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      value={formData.source}
                      onChange={e => setFormData({...formData, source: e.target.value as LeadSource})}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="manual">Manual</option>
                      <option value="website">Website</option>
                      <option value="instagram">Instagram</option>
                      <option value="agent">Agent</option>
                      <option value="referral">Referral</option>
                      <option value="network">Network</option>
                      <option value="campaign">Campaign</option>
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value as LeadPriority})}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      value={formData.assigned_to}
                      onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input 
                        type="number"
                        className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                        placeholder="0.00"
                        value={formData.budget === 0 ? '' : formData.budget}
                        onChange={e => setFormData({...formData, budget: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="create-lead-form"
            disabled={isLoading}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Lead
          </button>
        </div>
      </div>
    </div>
  );
};
