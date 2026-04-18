import { useState, useEffect, useCallback } from 'react';
import { VisaTracking, VisaStatus, PassportCustody, VisaDocumentType } from '../types/visa';
import { visaService } from '../services/visaService';
import { useAuth } from '@/core/hooks/useAuth';

export function useVisa(id: string) {
  const { tenant } = useAuth();
  const [visa, setVisa] = useState<VisaTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await visaService.getVisaById(id);
      setVisa(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (status: VisaStatus, extraFields?: any) => {
    try {
      await visaService.updateVisaStatus(id, status, extraFields);
      await fetchData();
    } catch (e: any) {
      throw e;
    }
  };

  const updateCustody = async (custody: PassportCustody) => {
    try {
      await visaService.updatePassportCustody(id, custody);
      await fetchData();
    } catch (eValue: any) {
      throw eValue;
    }
  };

  const updateFinancials = async (fields: { visa_fee?: number; service_charge?: number }) => {
    try {
      await visaService.updateVisa(id, fields);
      await fetchData();
    } catch (e: any) {
      throw e;
    }
  };

  const uploadDoc = async (file: File, type: VisaDocumentType) => {
    if (!tenant?.id || !visa) return;
    try {
      await visaService.uploadDocument(id, tenant.id, file, type);
      await fetchData();
    } catch (e: any) {
      throw e;
    }
  };

  const deleteDoc = async (docId: string, storagePath: string) => {
    try {
      await visaService.deleteDocument(docId, storagePath);
      await fetchData();
    } catch (e: any) {
      throw e;
    }
  };

  const updateNotes = async (notes: string) => {
    try {
      await visaService.updateVisa(id, { notes });
      // Not necessarily refreshing data immediately as blur save
    } catch (e) {
      console.error(e);
    }
  };

  return {
    visa,
    isLoading,
    error,
    updateStatus,
    updateCustody,
    updateFinancials,
    uploadDoc,
    deleteDoc,
    updateNotes,
    refreshVisa: fetchData
  };
}
