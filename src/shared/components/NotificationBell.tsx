import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/core/hooks/useNotifications';
import { clsx } from 'clsx';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <button 
      onClick={() => navigate('/notifications')}
      className="relative p-2 text-slate-400 hover:text-indigo-600 transition-all active:scale-95 group"
    >
      <Bell className={clsx("w-5 h-5 transition-transform group-hover:rotate-12", unreadCount > 0 && "text-indigo-600")} />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-indigo-600 rounded-full ring-2 ring-white text-[8px] font-black text-white flex items-center justify-center animate-in zoom-in-0 duration-300">
           {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
