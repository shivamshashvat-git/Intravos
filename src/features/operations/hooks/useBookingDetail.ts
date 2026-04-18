import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingService, GroupMember, BookingStatus } from '../types/booking';
import { bookingsService } from '../services/bookingsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useBookingDetail(id: string) {
  const { tenant } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id || !tenant?.id) return;
    setIsLoading(true);
    try {
      const data = await bookingsService.getBookingById(id, tenant.id);
      setBooking(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, tenant?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (status: BookingStatus, reason?: string) => {
    try {
      await bookingsService.updateStatus(id, status, reason);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addService = async (service: Partial<BookingService>) => {
    if (!tenant?.id) return;
    try {
      await bookingsService.addService(id, tenant.id, service);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      await bookingsService.deleteService(serviceId);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addMember = async (member: Partial<GroupMember>) => {
    if (!tenant?.id) return;
    try {
      await bookingsService.addMember(id, tenant.id, member);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      await bookingsService.deleteMember(memberId);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateBookingValue = async (updates: Partial<Booking>) => {
      try {
          await bookingsService.updateBooking(id, updates);
          await fetchData();
      } catch (e) {
          console.error(e);
          throw e;
      }
  };

  return {
    booking,
    isLoading,
    error,
    refresh: fetchData,
    updateStatus,
    addService,
    deleteService,
    addMember,
    deleteMember,
    updateBookingValue
  };
}
