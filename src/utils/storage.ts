const STORAGE_KEYS = {
  config: 'sentiment_dashboard_config',
  sentiments: 'sentiment_dashboard_items',
  briefings: 'sentiment_dashboard_briefings',
  assignments: 'sentiment_dashboard_assignments',
  templates: 'sentiment_dashboard_templates',
  periodNotes: 'sentiment_dashboard_period_notes',
};

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.error('Failed to parse from storage:', e);
  }
  return defaultValue;
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export const storage = {
  get config() {
    return STORAGE_KEYS.config;
  },
  get sentiments() {
    return STORAGE_KEYS.sentiments;
  },
  get briefings() {
    return STORAGE_KEYS.briefings;
  },
  get assignments() {
    return STORAGE_KEYS.assignments;
  },
};
