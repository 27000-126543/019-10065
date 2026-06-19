export function generateBriefing(
  sentiments: Array<{
    id: string;
    title: string;
    level: string;
    heat: number;
    source: string;
    status: string;
    responseNote?: string;
  }>,
  period: 'morning' | 'noon' | 'close',
  companyName: string,
  date: string
): string {
  const periodLabels = {
    morning: '开盘前',
    noon: '午间',
    close: '收盘后',
  };

  const levelLabels: Record<string, string> = {
    regulatory: '监管敏感',
    stock: '股价联动',
    investor: '投资者提问',
    general: '普通讨论',
  };

  const regulatory = sentiments.filter((s) => s.level === 'regulatory');
  const stock = sentiments.filter((s) => s.level === 'stock');
  const investor = sentiments.filter((s) => s.level === 'investor');
  const general = sentiments.filter((s) => s.level === 'general');
  const pending = sentiments.filter((s) => s.status === 'pending');

  let content = `【${companyName}】舆情早会简报（${periodLabels[period]}）\n`;
  content += `日期：${date}\n`;
  content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  content += `一、总体概览\n`;
  content += `  今日舆情总数：${sentiments.length} 条\n`;
  content += `  待处置：${pending.length} 条\n`;
  content += `  监管敏感：${regulatory.length} 条\n`;
  content += `  股价联动：${stock.length} 条\n`;
  content += `  投资者提问：${investor.length} 条\n`;
  content += `  普通讨论：${general.length} 条\n\n`;

  if (regulatory.length > 0) {
    content += `二、监管敏感（需重点关注）\n`;
    regulatory.forEach((s, i) => {
      content += `  ${i + 1}. ${s.title}\n`;
      content += `     来源：${s.source} | 热度：${s.heat}\n`;
      content += `     状态：${s.status === 'pending' ? '⚠️ 待处置' : '✓ 已处理'}\n`;
      if (s.responseNote) {
        content += `     口径：${s.responseNote}\n`;
      }
      content += `\n`;
    });
  }

  if (stock.length > 0) {
    content += `三、股价联动\n`;
    stock.forEach((s, i) => {
      content += `  ${i + 1}. ${s.title}\n`;
      content += `     来源：${s.source} | 热度：${s.heat}\n`;
      content += `     状态：${s.status === 'pending' ? '⚠️ 待处置' : '✓ 已处理'}\n`;
      if (s.responseNote) {
        content += `     口径：${s.responseNote}\n`;
      }
      content += `\n`;
    });
  }

  if (investor.length > 0) {
    content += `四、投资者集中提问\n`;
    investor.forEach((s, i) => {
      content += `  ${i + 1}. ${s.title}\n`;
      content += `     来源：${s.source} | 热度：${s.heat}\n`;
      content += `     状态：${s.status === 'pending' ? '⚠️ 待回复' : '✓ 已回复'}\n`;
      if (s.responseNote) {
        content += `     回复口径：${s.responseNote}\n`;
      }
      content += `\n`;
    });
  }

  content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  content += `本简报由舆情盯盘台自动生成，仅供内部参考\n`;

  return content;
}
