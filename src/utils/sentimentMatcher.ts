import type {
  CompanyConfig,
  RawSentimentItem,
  SentimentItem,
  SentimentLevel,
  MatchHit,
  MatchType,
  DisposalStatus,
  DisposalRecord,
  MeetingAssignment,
} from '../types';

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const determineLevel = (
  raw: RawSentimentItem,
  hits: MatchHit[]
): SentimentLevel => {
  const hasMisspelling = hits.some((h) => h.type === 'misspelling');
  if (hasMisspelling) return 'general';

  const regulatoryKeywords = ['监管', '问询函', '处罚', '合规', '证监会', '交易所', '新规', '披露'];
  if (raw.tags.some((t) => regulatoryKeywords.some((k) => t.includes(k)))) {
    return 'regulatory';
  }

  const stockKeywords = ['股价', '涨停', '跌停', '异动', '市值', '龙虎榜', '机构买入', '业绩公告', '中标', '收购'];
  if (raw.tags.some((t) => stockKeywords.some((k) => t.includes(k)))) {
    return 'stock';
  }

  if (raw.sourceType === 'qa' || raw.tags.includes('投资者提问')) {
    return 'investor';
  }

  return 'general';
};

const buildReasons = (raw: RawSentimentItem, hits: MatchHit[], level: SentimentLevel): string[] => {
  const reasons: string[] = [];

  reasons.push(...raw.tags.slice(0, 2));

  const hitLabels: Record<MatchType, string> = {
    companyName: '命中公司简称',
    stockCode: '命中股票代码',
    coreProduct: '命中核心产品',
    executive: '命中董监高',
    misspelling: '命中常见误写词',
    industry: '涉及所属行业',
    generic: '通用规则',
  };

  const uniqueHitTypes = [...new Set(hits.map((h) => h.type))];
  uniqueHitTypes.slice(0, 2).forEach((type) => {
    const hit = hits.find((h) => h.type === type);
    if (hit) {
      reasons.push(`${hitLabels[type]}：「${hit.keyword}」`);
    }
  });

  if (level === 'regulatory' && !reasons.includes('需限期回复')) {
    reasons.push('需重点关注');
  }
  if (level === 'investor') {
    reasons.push('投资者关注度高');
  }

  return [...new Set(reasons)].slice(0, 4);
};

interface PersistedState {
  status: DisposalStatus;
  responseNote?: string;
  responseTime?: string;
  disposalHistory: DisposalRecord[];
}

export function matchSentiments(
  rawPool: RawSentimentItem[],
  config: CompanyConfig,
  persistedStates: Record<string, PersistedState> = {},
  persistedAssignments: Record<string, MeetingAssignment> = {}
): SentimentItem[] {
  const matched: SentimentItem[] = [];
  const replaceAll = (str: string, search: string, replace: string) => str.split(search).join(replace);

  for (const raw of rawPool) {
    if (!config.dataSources.includes(raw.sourceType)) {
      continue;
    }

    const hits: MatchHit[] = [];
    let processedTitle = raw.title;
    let processedSummary = raw.summary;
    let skipItem = false;

    const checkKeyword = (
      text: string,
      keyword: string,
      type: MatchType,
      placeholder?: string
    ): boolean => {
      const idx = text.indexOf(placeholder || keyword);
      if (idx !== -1) {
        hits.push({
          type,
          keyword,
          matchedText: keyword,
        });
        return true;
      }
      return false;
    };

    const titleContainsCompany = checkKeyword(processedTitle, config.companyName, 'companyName', '{COMPANY}');
    const summaryContainsCompany = checkKeyword(processedSummary, config.companyName, 'companyName', '{COMPANY}');
    if (titleContainsCompany || summaryContainsCompany) {
      processedTitle = replaceAll(processedTitle, '{COMPANY}', config.companyName);
      processedSummary = replaceAll(processedSummary, '{COMPANY}', config.companyName);
    }

    const titleContainsCode = checkKeyword(processedTitle, config.stockCode, 'stockCode', '{STOCK_CODE}');
    const summaryContainsCode = checkKeyword(processedSummary, config.stockCode, 'stockCode', '{STOCK_CODE}');
    if (titleContainsCode || summaryContainsCode) {
      processedTitle = replaceAll(processedTitle, '{STOCK_CODE}', config.stockCode);
      processedSummary = replaceAll(processedSummary, '{STOCK_CODE}', config.stockCode);
    }

    const titleContainsIndustry = checkKeyword(processedTitle, config.industry, 'industry', '{INDUSTRY}');
    const summaryContainsIndustry = checkKeyword(processedSummary, config.industry, 'industry', '{INDUSTRY}');
    if (titleContainsIndustry || summaryContainsIndustry) {
      processedTitle = replaceAll(processedTitle, '{INDUSTRY}', config.industry);
      processedSummary = replaceAll(processedSummary, '{INDUSTRY}', config.industry);
    }

    const needsProduct = processedTitle.includes('{PRODUCT}') || processedSummary.includes('{PRODUCT}');
    if (needsProduct) {
      if (config.coreProducts.length === 0) {
        skipItem = true;
      } else {
        const product = pickRandom(config.coreProducts);
        hits.push({ type: 'coreProduct', keyword: product, matchedText: product });
        processedTitle = replaceAll(processedTitle, '{PRODUCT}', product);
        processedSummary = replaceAll(processedSummary, '{PRODUCT}', product);
      }
    }

    const needsExecutive = processedTitle.includes('{EXECUTIVE}') || processedSummary.includes('{EXECUTIVE}');
    if (needsExecutive) {
      if (config.executives.length === 0) {
        skipItem = true;
      } else {
        const exec = pickRandom(config.executives);
        hits.push({ type: 'executive', keyword: exec, matchedText: exec });
        processedTitle = replaceAll(processedTitle, '{EXECUTIVE}', exec);
        processedSummary = replaceAll(processedSummary, '{EXECUTIVE}', exec);
      }
    }

    const needsMisspell = processedTitle.includes('{MISSPELL}') || processedSummary.includes('{MISSPELL}');
    if (needsMisspell) {
      if (config.commonMisspellings.length === 0) {
        skipItem = true;
      } else {
        const misspell = pickRandom(config.commonMisspellings);
        hits.push({ type: 'misspelling', keyword: misspell, matchedText: misspell });
        processedTitle = replaceAll(processedTitle, '{MISSPELL}', misspell);
        processedSummary = replaceAll(processedSummary, '{MISSPELL}', misspell);
      }
    }

    if (skipItem || hits.length === 0) {
      continue;
    }

    const level = determineLevel(raw, hits);
    const reasons = buildReasons(raw, hits, level);

    let heat = raw.baseHeat;
    if (hits.some((h) => h.type === 'misspelling')) {
      heat = Math.max(30, heat - 20);
    }
    if (level === 'regulatory') {
      heat = Math.min(100, heat + 5);
    }
    if (hits.length >= 3) {
      heat = Math.min(100, heat + 5);
    }

    const id = raw.id;
    const persisted = persistedStates[id];
    const assignment = persistedAssignments[id];

    matched.push({
      id,
      title: processedTitle,
      summary: processedSummary,
      source: raw.source,
      sourceType: raw.sourceType,
      publishTime: raw.publishTime,
      heat,
      level,
      reasons,
      matchHits: hits,
      url: raw.url,
      status: persisted?.status ?? 'pending',
      responseNote: persisted?.responseNote,
      responseTime: persisted?.responseTime,
      disposalHistory: persisted?.disposalHistory ?? [],
      assignment,
    });
  }

  return matched.sort((a, b) => {
    const levelOrder = { regulatory: 0, stock: 1, investor: 2, general: 3 };
    if (levelOrder[a.level] !== levelOrder[b.level]) {
      return levelOrder[a.level] - levelOrder[b.level];
    }
    return b.heat - a.heat;
  });
}

export function extractPersistedStates(
  items: SentimentItem[]
): Record<string, PersistedState> {
  const result: Record<string, PersistedState> = {};
  for (const item of items) {
    result[item.id] = {
      status: item.status,
      responseNote: item.responseNote,
      responseTime: item.responseTime,
      disposalHistory: item.disposalHistory,
    };
  }
  return result;
}
