import { create } from 'zustand';
import type { CompanyConfig, SentimentItem, DisposalStatus } from '../types';
import { defaultConfig, mockSentiments } from '../data/mockSentiments';
import { getFromStorage, setToStorage, storage } from '../utils/storage';

interface SentimentState {
  config: CompanyConfig;
  sentiments: SentimentItem[];
  setConfig: (config: CompanyConfig) => void;
  updateSentimentStatus: (id: string, status: DisposalStatus, note?: string) => void;
  getByLevel: (level: string) => SentimentItem[];
  getByStatus: (status: DisposalStatus) => SentimentItem[];
  getPendingCount: () => number;
  getTodayStats: () => {
    total: number;
    regulatory: number;
    stock: number;
    investor: number;
    general: number;
    replied: number;
  };
}

export const useSentimentStore = create<SentimentState>((set, get) => ({
  config: getFromStorage(storage.config, defaultConfig),
  sentiments: getFromStorage(storage.sentiments, mockSentiments),

  setConfig: (config) => {
    set({ config });
    setToStorage(storage.config, config);
  },

  updateSentimentStatus: (id, status, note) => {
    set((state) => {
      const updated = state.sentiments.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              responseNote: note ?? item.responseNote,
              responseTime: new Date().toISOString(),
            }
          : item
      );
      setToStorage(storage.sentiments, updated);
      return { sentiments: updated };
    });
  },

  getByLevel: (level) => {
    return get().sentiments.filter((s) => s.level === level);
  },

  getByStatus: (status) => {
    return get().sentiments.filter((s) => s.status === status);
  },

  getPendingCount: () => {
    return get().sentiments.filter((s) => s.status === 'pending').length;
  },

  getTodayStats: () => {
    const all = get().sentiments;
    return {
      total: all.length,
      regulatory: all.filter((s) => s.level === 'regulatory').length,
      stock: all.filter((s) => s.level === 'stock').length,
      investor: all.filter((s) => s.level === 'investor').length,
      general: all.filter((s) => s.level === 'general').length,
      replied: all.filter((s) => s.status === 'replied' || s.status === 'verified').length,
    };
  },
}));
