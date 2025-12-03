import { useState, useCallback, useEffect } from 'react';
import { api, Idea } from '../services/api';

export function useIdeasSync(localIdeas: Idea[]) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [summary, setSummary] = useState<{
    totalIdeas: number;
    mainThemes: string[];
    suggestedNarratives: any[];
  } | null>(null);

  // Auto-sync every 30 seconds if there are changes
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (localIdeas.length > 0 && !isSyncing) {
        syncIdeas();
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [localIdeas, isSyncing]);

  const syncIdeas = useCallback(async () => {
    if (localIdeas.length === 0) return;

    setIsSyncing(true);
    try {
      await api.syncIdeas(localIdeas);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to sync ideas:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [localIdeas]);

  const analyzeIdea = useCallback(async (ideaId: string, content: string) => {
    try {
      const analysis = await api.analyzeIdea(ideaId, content);
      return analysis;
    } catch (err) {
      console.error('Failed to analyze idea:', err);
      return null;
    }
  }, []);

  const getConnections = useCallback(async (ideaId: string) => {
    try {
      const connections = await api.getIdeaConnections(ideaId);
      return connections;
    } catch (err) {
      console.error('Failed to get connections:', err);
      return [];
    }
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const data = await api.getIdeasSummary();
      setSummary(data);
      return data;
    } catch (err) {
      console.error('Failed to get summary:', err);
      return null;
    }
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    summary,
    syncIdeas,
    analyzeIdea,
    getConnections,
    refreshSummary,
  };
}
