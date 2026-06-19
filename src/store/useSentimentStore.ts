import { create } from 'zustand';
import type { CompanyConfig, SentimentItem, DisposalStatus, MeetingAssignment } from '../types';
import { defaultConfig, rawSentimentPool } from '../data/mockSentiments';
import { getFromStorage, setToStorage, storage } from '../utils/storage';
import { matchSentiments, extractPersistedStates } from '../utils/sentimentMatcher';

interface PersistedDisposalState {
  status: DisposalStatus;
  responseNote?: string;
  responseTime?: string;
  disposalHistory: Array<{
    status: DisposalStatus;
    note?: string;
    operator: string;
    timestamp: string;
  }>;
}

interface SentimentState {
  config: CompanyConfig;
  persistedDisposal: Record<string, PersistedDisposalState>;
  persistedAssignments: Record<string, MeetingAssignment>;
  setConfig: (config: CompanyConfig) => void;
  getSentiments: () => SentimentItem[];
  updateSentimentStatus: (id: string, status: DisposalStatus, note?: string, operator?: string) => void;
  setAssignment: (id: string, assignment: Partial<Omit<MeetingAssignment, 'createdAt' | 'updatedAt'>>) => void;
  clearAssignment: (id: string) => void;
  clearDisposalHistory: (id: string) => void;
}

export const useSentimentStore = create<SentimentState>((set, get) => ({
  config: getFromStorage(storage.config, defaultConfig as CompanyConfig),
  persistedDisposal: getFromStorage(storage.sentiments, {}),
  persistedAssignments: getFromStorage(storage.assignments, {}),

  setConfig: (config) => {
    set({ config });
    setToStorage(storage.config, config);
  },

  getSentiments: () => {
    const { config, persistedDisposal, persistedAssignments } = get();
    return matchSentiments(rawSentimentPool, config, persistedDisposal, persistedAssignments);
  },

  updateSentimentStatus: (id, status, note, operator = '证代') => {
    set((state) => {
      const existing = state.persistedDisposal[id];
      const newHistory = [
        ...(existing?.disposalHistory ?? []),
        {
          status,
          note,
          operator,
          timestamp: new Date().toISOString(),
        },
      ];

      const newPersisted: Record<string, PersistedDisposalState> = {
        ...state.persistedDisposal,
        [id]: {
          status,
          responseNote: note ?? existing?.responseNote,
          responseTime: new Date().toISOString(),
          disposalHistory: newHistory,
        },
      };

      setToStorage(storage.sentiments, newPersisted);
      return { persistedDisposal: newPersisted };
    });
  },

  setAssignment: (id, patch) => {
    set((state) => {
      const existing = state.persistedAssignments[id];
      const now = new Date().toISOString();
      const newAssignment: MeetingAssignment = {
        department: '',
        ...existing,
        ...patch,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      const next = { ...state.persistedAssignments, [id]: newAssignment };
      setToStorage(storage.assignments, next);
      return { persistedAssignments: next };
    });
  },

  clearAssignment: (id) => {
    set((state) => {
      const next = { ...state.persistedAssignments };
      delete next[id];
      setToStorage(storage.assignments, next);
      return { persistedAssignments: next };
    });
  },

  clearDisposalHistory: (id) => {
    set((state) => {
      const newPersisted = { ...state.persistedDisposal };
      delete newPersisted[id];
      setToStorage(storage.sentiments, newPersisted);
      return { persistedDisposal: newPersisted };
    });
  },
}));

export function useSentiments(): SentimentItem[] {
  const config = useSentimentStore((s) => s.config);
  const persisted = useSentimentStore((s) => s.persistedDisposal);
  const persistedAssignments = useSentimentStore((s) => s.persistedAssignments);
  return matchSentiments(rawSentimentPool, config, persisted, persistedAssignments);
}
