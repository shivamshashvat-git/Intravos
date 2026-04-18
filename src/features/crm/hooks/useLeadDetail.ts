import { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadNote, LeadFollowup, LeadCommunication, TimelineEntry } from '@/features/crm/types/lead';
import { leadsService } from '@/features/crm/services/leadsService';
import { useAuth } from '@/core/hooks/useAuth';

export function useLeadDetail(leadId: string) {
  const { tenant } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [followups, setFollowups] = useState<LeadFollowup[]>([]);
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [leadData, notesData, followupsData, commsData] = await Promise.all([
        leadsService.getLeadById(leadId),
        leadsService.getNotes(leadId),
        leadsService.getFollowups(leadId),
        leadsService.getCommunications(leadId)
      ]);

      setLead(leadData.lead);
      setNotes(notesData);
      setFollowups(followupsData);
      setCommunications(commsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = [];

    // Add Notes
    notes.forEach(note => {
      entries.push({
        id: note.id,
        type: 'note',
        date: note.created_at,
        content: note.content,
        is_pinned: note.is_pinned,
        metadata: note,
        user_id: note.user_id
      });
    });

    // Add Communications
    communications.forEach(comm => {
      entries.push({
        id: comm.id,
        type: 'communication',
        date: comm.comm_date,
        content: comm.summary || `${comm.comm_type} (${comm.direction})`,
        metadata: comm,
        user_id: comm.user_id
      });
    });

    // Add Followups (Done ones)
    followups.filter(f => f.is_done).forEach(f => {
      entries.push({
        id: f.id,
        type: 'followup',
        date: f.created_at, // Use created_at or some other date? The prompt says "follow-ups (done only)"
        content: f.note || 'Follow-up completed',
        metadata: f,
        user_id: f.user_id
      });
    });

    // Sort by date desc (pinned at top)
    return entries.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [notes, communications, followups]);

  return {
    lead,
    notes,
    followups,
    communications,
    timeline,
    isLoading,
    error,
    refreshLead: fetchData,
    setLead
  };
}
