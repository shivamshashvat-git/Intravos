import React, { useState, useEffect } from 'react';
import { Search, User, Loader2, Check, X } from 'lucide-react';
import { customersService } from '@/features/crm/services/customersService';
import { useAuth } from '@/core/hooks/useAuth';
import { clsx } from 'clsx';

interface CustomerSelectorProps {
  onSelect: (customer: any) => void;
  selectedId?: string;
  placeholder?: string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({ onSelect, selectedId, placeholder }) => {
  const { tenant } = useAuth();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (search.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else if (search === '') {
      setCustomers([]);
    }
  }, [search]);

  const handleSearch = async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const { data } = await customersService.getCustomers(tenant.id, { search });
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
        <input
          className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm italic"
          placeholder={placeholder || "Search Customer Name, Phone, ID..."}
          value={selected ? selected.name : search}
          onChange={(e) => {
            if (selected) {
              setSelected(null);
              onSelect(null);
            }
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {selected && (
          <button 
            onClick={() => { setSelected(null); onSelect(null); setSearch(''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (search.length >= 2 || customers.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {isLoading && (
            <div className="p-4 flex items-center justify-center gap-3 italic text-[10px] font-black uppercase text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Querying Cluster...
            </div>
          )}
          {!isLoading && customers.length === 0 && (
            <div className="p-4 text-center italic text-[10px] font-black uppercase text-slate-400">
              No entities found in this sector.
            </div>
          )}
          {!isLoading && customers.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelected(c);
                onSelect(c);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-black text-indigo-400 text-xs">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{c.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone || 'NO_COMM_NODE'}</p>
                </div>
              </div>
              {selectedId === c.id && <Check className="w-4 h-4 text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
