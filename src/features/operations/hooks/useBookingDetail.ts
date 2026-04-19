
import { useState, useEffect, useCallback } from 'react';
import { Booking, BookingService, GroupMember, BookingStatus } from '../types/booking';
import { bookingsService } from '../services/bookingsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useBookingDetail(id: string) {
  const { tenant } = useAuth();
  const [hub, setHub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id || !tenant?.id) return;
    setIsLoading(true);
    try {
      const data = await bookingsService.getBookingHub(id);
      setHub(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, tenant?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (status: BookingStatus) => {
    try {
      await bookingsService.updateBooking(id, { status });
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const cancelBooking = async (payload: any) => {
    try {
        await bookingsService.cancelBooking(id, payload);
        await fetchData();
    } catch (e) {
        console.error(e);
        throw e;
    }
  }

  const addService = async (service: any) => {
    try {
      await bookingsService.addService(id, service);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateService = async (serviceId: string, updates: any) => {
    try {
        await bookingsService.updateService(id, serviceId, updates);
        await fetchData();
    } catch (e) {
        console.error(e);
        throw e;
    }
  }

  const deleteService = async (serviceId: string) => {
    try {
      await bookingsService.deleteService(id, serviceId);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const addMember = async (member: any) => {
    try {
      await bookingsService.addGroupMember(id, member);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateMember = async (memberId: string, updates: any) => {
    try {
        await bookingsService.updateGroupMember(memberId, updates);
        await fetchData();
    } catch (e) {
        console.error(e);
        throw e;
    }
  }

  const deleteMember = async (memberId: string) => {
    try {
      await bookingsService.deleteGroupMember(memberId);
      await fetchData();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateBooking = async (updates: Partial<Booking>) => {
      try {
          await bookingsService.updateBooking(id, updates);
          await fetchData();
      } catch (e) {
          console.error(e);
          throw e;
      }
  };

  return {
    booking: hub?.booking,
    hub,
    isLoading,
    error,
    refresh: fetchData,
    updateStatus,
    cancelBooking,
    addService,
    updateService,
    deleteService,
    addMember,
    updateMember,
    deleteMember,
    updateBooking
  };
}
