export type SentimentLevel = 'regulatory' | 'stock' | 'investor' | 'general';

export type DisposalStatus = 'pending' | 'replied' | 'verified' | 'ignored';

export type SourceType = 'news' | 'stockbar' | 'social' | 'qa';

export interface CompanyConfig {
  companyName: string;
  stockCode: string;
  industry: string;
  coreProducts: string[];
  executives: string[];
  commonMisspellings: string[];
  dataSources: SourceType[];
}

export interface SentimentItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceType: SourceType;
  publishTime: string;
  heat: number;
  level: SentimentLevel;
  reasons: string[];
  url: string;
  status: DisposalStatus;
  responseNote?: string;
  responseTime?: string;
}

export interface Briefing {
  id: string;
  period: 'morning' | 'noon' | 'close';
  date: string;
  content: string;
  createdAt: string;
}

export interface HeatTrendPoint {
  time: string;
  value: number;
}
