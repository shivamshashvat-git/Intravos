import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/lib/supabase';
import { notificationsService, Notification } from '@/features/tasks/services/notificationsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useNotifications() {
  const { user, tenant } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = useCallback(async () => {
    if (!user || !tenant) return;
    try {
      const data = await notificationsService.getUnreadNotifications(user.id, tenant.id);
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (e) {
      console.error(e);
    }
  }, [user, tenant]);

  useEffect(() => {
    fetchNotifs();

    if (!user) return;

    const channel = supabase.channel(`notifications-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(c => c + 1);
        // Toast could be triggered here
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifs]);

  const markRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!user || !tenant) return;
    await notificationsService.markAllAsRead(user.id, tenant.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    refresh: fetchNotifs
  };
}
