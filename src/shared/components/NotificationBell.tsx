import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Calendar, User, DollarSign, Bell, AlertTriangle, 
  Settings, Clock, ArrowRight, ShieldAlert
} from 'lucide-react';
import { useNotifications } from '@/core/hooks/useNotifications';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <CheckSquare size={16} className="text-emerald-500" />;
      case 'task_due': return <Calendar size={16} className="text-amber-500" />;
      case 'lead_assigned': return <User size={16} className="text-blue-500" />;
      case 'payment_received': return <DollarSign size={16} className="text-emerald-500" />;
      case 'followup_due': return <Bell size={16} className="text-indigo-500" />;
      case 'trial_expiring': return <ShieldAlert size={16} className="text-red-500" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  const handleNotifClick = (notif: any) => {
    markRead(notif.id);
    if (notif.lead_id) navigate(`/leads/${notif.lead_id}`);
    else if (notif.booking_id) navigate(`/bookings/${notif.booking_id}`);
    else if (notif.task_id) navigate(`/tasks`);
    onClose();
  };

  return (
    <div className="absolute right-0 mt-3 w-[360px] bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-[100] animate-in slide-in-from-top-2">
       <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
             <Bell className="w-4 h-4 text-indigo-600" /> Neural Node Feed
          </h3>
          <button onClick={markAllRead} className="text-[8px] font-black uppercase text-indigo-600 underline">Sync All Read</button>
       </div>

       <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <div className="py-20 text-center space-y-4">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200"><Bell className="w-6 h-6" /></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">No unread signals detected.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => handleNotifClick(n)}
                className="px-8 py-5 hover:bg-slate-50 transition-all cursor-pointer relative group flex items-start gap-4"
              >
                 <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all">{getIcon(n.notif_type)}</div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase italic text-slate-900 leading-tight mb-1">{n.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 line-clamp-1">{n.message}</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase italic mt-2 tracking-tight">{timeAgo(n.created_at)}</p>
                 </div>
                 {!n.is_read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>}
              </div>
            ))
          )}
       </div>

       <div className="p-6 border-t border-slate-100 bg-white">
          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
             Open Sequence Archive <ArrowRight className="w-4 h-4 text-indigo-400" />
          </button>
       </div>
    </div>
  );
};
