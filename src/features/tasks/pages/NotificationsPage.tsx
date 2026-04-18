import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Calendar, User, DollarSign, Bell, 
  Clock, Trash2, CheckCircle2, Inbox, 
  ShieldAlert, AlertTriangle, Info, RefreshCw
} from 'lucide-react';
import { useNotifications } from '@/core/hooks/useNotifications';
import { notificationsService, Notification } from '@/features/tasks/services/notificationsService';
import { useAuth } from '@/core/hooks/useAuth';
import { timeAgo } from '@/utils/time';
import { clsx } from 'clsx';
import { toast } from 'sonner';

type FilterType = 'all' | 'unread' | 'system' | 'reminder';

export const NotificationsPage: React.FC = () => {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!user || !tenant) return;
    setIsLoading(true);
    try {
      const filters: any = {
        page: pageNum,
        limit: 20
      };

      if (activeFilter === 'unread') filters.unread_only = true;
      if (activeFilter === 'system') filters.type = 'system';
      if (activeFilter === 'reminder') filters.type = 'reminder';

      const { data, count } = await notificationsService.getNotifications(user.id, tenant.id, filters);
      
      if (append) {
        setNotifications(prev => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      
      setTotalCount(count);
      setHasMore(data.length === 20 && (pageNum * 20) < count);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user, tenant, activeFilter]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, false);
  }, [activeFilter, fetchNotifications]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleMarkRead = async (id: string) => {
    await markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setTotalCount(prev => prev - 1);
  };

  const handleNotifClick = (notif: Notification) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    
    if (notif.lead_id) navigate(`/leads/${notif.lead_id}`);
    else if (notif.booking_id) navigate(`/bookings/${notif.booking_id}`);
    else if (notif.task_id) navigate(`/tasks`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <CheckSquare size={18} className="text-emerald-500" />;
      case 'task_due': return <Calendar size={18} className="text-amber-500" />;
      case 'lead_assigned': return <User size={18} className="text-blue-500" />;
      case 'payment_received': return <DollarSign size={18} className="text-emerald-500" />;
      case 'followup_due': return <Bell size={18} className="text-indigo-500" />;
      case 'trial_expiring': return <ShieldAlert size={18} className="text-red-500" />;
      case 'system': return <Info size={18} className="text-slate-400" />;
      case 'reminder': return <Clock size={18} className="text-amber-500" />;
      default: return <Bell size={18} className="text-slate-400" />;
    }
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All Notifications' },
    { id: 'unread', label: 'Unread' },
    { id: 'system', label: 'System' },
    { id: 'reminder', label: 'Reminders' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 italic">
       <div className="flex justify-between items-end">
          <div>
             <h1 className="text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none mb-2 underline decoration-indigo-600 decoration-8 underline-offset-8">Notification Inbox</h1>
             <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[10px] mt-4">Neural event stream and signal archive</p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="px-8 py-3.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase italic rounded-2xl border border-indigo-100 shadow-sm hover:bg-white active:scale-95 transition-all flex items-center gap-2"
            >
               <CheckCircle2 className="w-4 h-4" /> Synchronize All Read
            </button>
          )}
       </div>

       {/* Filters */}
       <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-[2rem] w-fit border border-slate-200 shadow-inner">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={clsx(
                "px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-tighter transition-all italic",
                activeFilter === f.id ? "bg-white text-indigo-600 shadow-md border border-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
               {f.label} {f.id === 'unread' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
       </div>

       {/* Notifications List */}
       <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-100 overflow-hidden divide-y divide-slate-50 italic">
          {notifications.length === 0 ? (
            <div className="py-32 text-center space-y-6 flex flex-col items-center">
               <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 animate-pulse border border-slate-100 shadow-inner">
                  <Inbox className="w-10 h-10" />
               </div>
               <div>
                  <p className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">You're all caught up</p>
                  <p className="text-xs font-bold text-slate-300 uppercase italic tracking-widest mt-2">Zero active signals detected in the Neural Network</p>
               </div>
               <button onClick={() => fetchNotifications(1, false)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase italic flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" /> Force Signal Sync
               </button>
            </div>
          ) : (
            <>
              {notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={clsx(
                    "px-10 py-8 flex items-start gap-8 hover:bg-slate-50/80 transition-all cursor-pointer group relative",
                    !n.is_read ? "bg-white" : "bg-slate-50/30"
                  )}
                >
                   {/* Unread Indicator */}
                   {!n.is_read && (
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                   )}

                   {/* Icon */}
                   <div className={clsx(
                     "w-14 h-14 rounded-[1.5rem] bg-white border flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110",
                     !n.is_read ? "border-indigo-100" : "border-slate-100"
                   )}>
                      {getIcon(n.notif_type)}
                   </div>

                   {/* Content */}
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1.5">
                         <h3 className={clsx(
                           "text-base tracking-tight uppercase leading-none",
                           !n.is_read ? "font-black text-slate-950" : "font-black text-slate-500"
                         )}>{n.title}</h3>
                         <span className="text-[10px] font-bold text-slate-300 uppercase italic flex items-center gap-2 shrink-0">
                            <Clock className="w-3 h-3" /> {timeAgo(n.created_at)}
                         </span>
                      </div>
                      <p className={clsx(
                        "text-xs leading-relaxed line-clamp-2",
                        !n.is_read ? "font-bold text-slate-600" : "font-medium text-slate-400"
                      )}>{n.message}</p>
                      
                      {/* Sub-signals (links) */}
                      {(n.lead_id || n.booking_id || n.task_id) && (
                        <div className="mt-4 flex gap-2">
                           <span className="px-3 py-1 bg-slate-100 text-[8px] font-black uppercase text-slate-400 rounded-full border border-slate-200">Linked Parameter Node</span>
                        </div>
                      )}
                   </div>

                   {/* Actions */}
                   <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDelete(e, n.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm bg-white border border-slate-100"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              ))}

              {hasMore && (
                <div className="p-8 flex justify-center bg-slate-50/50">
                   <button 
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-12 py-4 bg-white border border-slate-200 text-slate-900 rounded-[2rem] text-xs font-black uppercase italic shadow-xl shadow-slate-200/50 flex items-center gap-3 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                   >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Load Sequential Signal Stack
                   </button>
                </div>
              )}
            </>
          )}
       </div>

       {/* Summary Footer */}
       <div className="flex items-center justify-between px-10">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Total Signals in Pipeline: {totalCount}</p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 italic">
             <RefreshCw className="w-3 h-3" /> Signal Integrity Stabilized
          </div>
       </div>
    </div>
  );
};
