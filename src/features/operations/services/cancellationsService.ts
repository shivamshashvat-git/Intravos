import { apiClient } from '@/core/lib/apiClient';

export interface CancellationRecord {
  id: string;
  booking_id: string;
  reason: string;
  penalty_amount: number;
  refund_amount: number;
  cancelled_by: string;
  tenant_id: string;
  created_at: string;
  // Joins
  bookings?: {
    booking_ref: string;
    customer_name: string;
    destination: string;
  };
}

export const cancellationsService = {
  getCancellations: async (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    const res = await apiClient(`/api/operations/cancellations?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch cancellations');
    const data = await res.json();
    return data.cancellations as CancellationRecord[];
  },

  getCancellation: async (id: string) => {
    const res = await apiClient(`/api/operations/cancellations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch cancellation');
    const data = await res.json();
    return data.cancellation as CancellationRecord;
  },

  cancelBooking: async (bookingId: string, payload: {
    reason: string;
    penalty_amount: number;
    refund_amount: number;
    cancelled_by: string;
    original_amount?: number;
    sudoToken?: string;
  }) => {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: payload.sudoToken ? { 'x-sudo-token': payload.sudoToken } : {}
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to cancel booking');
    }
    return res.json();
  }
};
