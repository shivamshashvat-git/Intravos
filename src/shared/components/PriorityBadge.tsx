import React, { useState, useRef, useEffect } from 'react';
import { LeadPriority } from '@/features/crm/types/lead';
import { ChevronDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface PriorityBadgeProps {
  priority: LeadPriority;
  onChange: (newPriority: LeadPriority) => Promise<void>;
}

const priorityConfig: Record<LeadPriority, { label: string, color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600 border-red-200' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, onChange }) => {
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

  const handleSelect = async (newPriority: LeadPriority) => {
    if (newPriority === priority) {
      setIsOpen(false);
      return;
    }
    setIsUpdating(true);
    try {
      await onChange(newPriority);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const config = priorityConfig[priority];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={isUpdating}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all hover:brightness-95 active:scale-95",
          config.color
        )}
      >
        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : config.label}
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
          {(Object.keys(priorityConfig) as LeadPriority[]).map((p) => (
            <button
              key={p}
              onClick={(e) => { e.stopPropagation(); handleSelect(p); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors capitalize",
                p === priority ? "text-indigo-600 bg-indigo-50" : "text-slate-600"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
