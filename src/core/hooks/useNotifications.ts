import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/core/lib/supabase';
import { notificationsService, Notification } from '@/features/tasks/services/notificationsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useNotifications() {
  const { user, tenant } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !tenant) return;
    try {
      const count = await notificationsService.getUnreadCount(user.id, tenant.id);
      setUnreadCount(count);
    } catch (e) {
      console.error(e);
    }
  }, [user, tenant]);

  const fetchNotifs = useCallback(async () => {
    if (!user || !tenant) return;
    setIsLoading(true);
    try {
      const data = await notificationsService.getUnreadNotifications(user.id, tenant.id);
      setNotifications(data);
      await fetchUnreadCount();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user, tenant, fetchUnreadCount]);

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
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifs, fetchUnreadCount]);

  const markRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    if (!user || !tenant) return;
    try {
      await notificationsService.markAllAsRead(user.id, tenant.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Refresh count if it was unread
      await fetchUnreadCount();
    } catch (e) {
      console.error(e);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    deleteNotification,
    refresh: fetchNotifs
  };
}
