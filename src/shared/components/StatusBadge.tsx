import React, { useState, useRef, useEffect } from 'react';
import { LeadStatus } from '@/features/crm/types/lead';
import { ChevronDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface StatusBadgeProps {
  status: LeadStatus;
  onChange: (newStatus: LeadStatus) => Promise<void>;
}

const statusConfig: Record<LeadStatus, { label: string, color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  quote_sent: { label: 'Quote Sent', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  negotiating: { label: 'Negotiating', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  converted: { label: 'Converted', color: 'bg-green-100 text-green-700 border-green-200' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' },
  on_hold: { label: 'On Hold', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = async (newStatus: LeadStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }
    setIsUpdating(true);
    try {
      await onChange(newStatus);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const config = statusConfig[status];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={isUpdating}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all hover:brightness-95 active:scale-95",
          config.color
        )}
      >
        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : config.label}
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
          {(Object.keys(statusConfig) as LeadStatus[]).map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); handleSelect(s); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors",
                s === status ? "text-indigo-600 bg-indigo-50" : "text-slate-600"
              )}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
