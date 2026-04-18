import { useState, useEffect, useCallback } from 'react';
import { trashService } from '../services/trashService';
import { TrashRecord } from '../types/trash';
import { toast } from 'sonner';
import { useAuth } from '@/core/hooks/useAuth';

export const useTrash = () => {
  const { tenant } = useAuth();
  const [records, setRecords] = useState<TrashRecord[]>([]);
  const [grouped, setGrouped] = useState<Record<string, TrashRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const isEnabled = tenant?.features_enabled?.includes('trash');

  const fetchTrash = useCallback(async () => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await trashService.getTrash();
      setRecords(data.trash || []);
      setGrouped(data.grouped || {});
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const toggleSelect = (table: string, id: string) => {
    const key = `${table}:${id}`;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const selectAll = () => {
    if (selectedKeys.size === records.length && records.length > 0) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(records.map(r => `${r.table_name}:${r.item_id}`)));
    }
  };

  const restore = async (table: string, id: string) => {
    try {
      await trashService.restoreRecord(table, id);
      toast.success('Record restored');
      await fetchTrash();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const purge = async (table: string, id: string) => {
    try {
      await trashService.permanentlyDelete(table, id);
      toast.success('Record permanently deleted');
      await fetchTrash();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const restoreBulk = async () => {
    const targets = Array.from(selectedKeys);
    let count = 0;
    for (const key of targets) {
      const [table, id] = key.split(':');
      try {
        await trashService.restoreRecord(table, id);
        count++;
      } catch (e) {}
    }
    toast.success(`Restored ${count} records`);
    setSelectedKeys(new Set());
    await fetchTrash();
  };

  const purgeBulk = async () => {
    const targets = Array.from(selectedKeys);
    let count = 0;
    for (const key of targets) {
      const [table, id] = key.split(':');
      try {
        await trashService.permanentlyDelete(table, id);
        count++;
      } catch (e) {}
    }
    toast.success(`Permanently deleted ${count} records`);
    setSelectedKeys(new Set());
    await fetchTrash();
  };

  return {
    records,
    grouped,
    loading,
    isEnabled,
    selectedKeys,
    toggleSelect,
    selectAll,
    restore,
    purge,
    restoreBulk,
    purgeBulk,
    refresh: fetchTrash
  };
};
