export type SentimentLevel = 'regulatory' | 'stock' | 'investor' | 'general';

export type DisposalStatus = 'pending' | 'replied' | 'verified' | 'ignored';

export type SourceType = 'news' | 'stockbar' | 'social' | 'qa';

export type MatchType = 'companyName' | 'stockCode' | 'coreProduct' | 'executive' | 'misspelling' | 'industry' | 'generic';

export interface MatchHit {
  type: MatchType;
  keyword: string;
  matchedText: string;
}

export interface DisposalRecord {
  status: DisposalStatus;
  note?: string;
  operator: string;
  timestamp: string;
}

export interface MeetingAssignment {
  department: string;
  deadline?: string;
  assignee?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseTemplate {
  id: string;
  title: string;
  content: string;
  level?: SentimentLevel;
  sourceType?: SourceType;
  matchType?: MatchType;
  tags: string[];
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodNote {
  period: 'morning' | 'noon' | 'close';
  meetingConclusion?: string;
  internalNote?: string;
  actionItems?: string;
  updatedAt: string;
}

export interface CompanyConfig {
  companyName: string;
  stockCode: string;
  industry: string;
  coreProducts: string[];
  executives: string[];
  commonMisspellings: string[];
  dataSources: SourceType[];
}

export interface RawSentimentItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceType: SourceType;
  publishTime: string;
  baseHeat: number;
  tags: string[];
  url: string;
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
  matchHits: MatchHit[];
  url: string;
  status: DisposalStatus;
  responseNote?: string;
  responseTime?: string;
  disposalHistory: DisposalRecord[];
  assignment?: MeetingAssignment;
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

export const matchTypeLabels: Record<MatchType, string> = {
  companyName: '公司简称',
  stockCode: '股票代码',
  coreProduct: '核心产品',
  executive: '董监高',
  misspelling: '常见误写',
  industry: '所属行业',
  generic: '通用规则',
};

export const matchTypeColors: Record<MatchType, string> = {
  companyName: 'bg-blue-50 text-blue-700 border-blue-200',
  stockCode: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  coreProduct: 'bg-green-50 text-green-700 border-green-200',
  executive: 'bg-purple-50 text-purple-700 border-purple-200',
  misspelling: 'bg-amber-50 text-amber-700 border-amber-200',
  industry: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  generic: 'bg-slate-50 text-slate-600 border-slate-200',
};
