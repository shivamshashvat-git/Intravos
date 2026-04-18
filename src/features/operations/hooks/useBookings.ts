import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingFilters, BookingStatus } from '../types/booking';
import { bookingsService } from '../services/bookingsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useBookings(initialFilters?: BookingFilters) {
  const { tenant } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<BookingFilters>({
    status: 'all',
    search: '',
    ...initialFilters
  });

  const fetchData = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const data = await bookingsService.getBookings(tenant.id, filters);
      setBookings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    active: bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
    departingThisWeek: bookings.filter(b => {
        const d = new Date(b.travel_date_start);
        const nextWeek = new Date(Date.now() + 7 * 86400000);
        return d >= new Date() && d <= nextWeek;
    }).length,
    completedMonth: bookings.filter(b => {
        const now = new Date();
        const d = new Date(b.completed_at || '');
        return b.status === 'completed' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    cancelledMonth: bookings.filter(b => {
        const now = new Date();
        const d = new Date(b.cancelled_at || '');
        return b.status === 'cancelled' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    departingToday: bookings.filter(b => b.travel_date_start === new Date().toISOString().split('T')[0]).length
  };

  return {
    bookings,
    isLoading,
    error,
    filters,
    setFilters,
    stats,
    refresh: fetchData
  };
}
