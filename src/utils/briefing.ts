import type { SentimentItem } from '../types';
import { matchTypeLabels } from '../types';

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

const statusLabels: Record<string, string> = {
  pending: '待处置',
  replied: '已回复',
  verified: '待核实',
  ignored: '无需处理',
};

function formatTime(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

function summarizeHits(item: SentimentItem): string {
  const uniqueTypes = [...new Set(item.matchHits.map((h) => matchTypeLabels[h.type]))];
  const uniqueKeywords = [...new Set(item.matchHits.map((h) => h.keyword))];
  if (uniqueTypes.length === 0) return '-';
  return `${uniqueTypes.join('、')}：${uniqueKeywords.slice(0, 3).join('、')}`;
}

interface BriefingOptions {
  period: 'morning' | 'noon' | 'close';
  companyName: string;
  date: string;
  sentiments: SentimentItem[];
}

export function generateBriefing({
  period,
  companyName,
  date,
  sentiments,
}: BriefingOptions): string {
  const regulatory = sentiments.filter((s) => s.level === 'regulatory');
  const stock = sentiments.filter((s) => s.level === 'stock');
  const investor = sentiments.filter((s) => s.level === 'investor');
  const general = sentiments.filter((s) => s.level === 'general');

  const pending = sentiments.filter((s) => s.status === 'pending');
  const verified = sentiments.filter((s) => s.status === 'verified');
  const replied = sentiments.filter((s) => s.status === 'replied');
  const ignored = sentiments.filter((s) => s.status === 'ignored');

  const total = sentiments.length;
  const disposalRate = total > 0 ? Math.round(((replied.length + verified.length + ignored.length) / total) * 100) : 0;

  let content = '';
  content += `【${companyName}】舆情早会简报（${periodLabels[period]}）\n`;
  content += `日期：${date}\n`;
  content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (period === 'morning') {
    content += `【开盘前风险提示】\n`;
    content += `本时段重点：监管风险 + 股价异动 + 待核实事项\n\n`;

    content += `一、总体概览\n`;
    content += `  今日舆情总数：${total} 条\n`;
    content += `  ⚠️ 监管敏感：${regulatory.length} 条（需优先关注）\n`;
    content += `  📈 股价联动：${stock.length} 条（影响开盘）\n`;
    content += `  ❓ 待处置：${pending.length} 条\n`;
    content += `  🔍 待核实：${verified.length} 条\n\n`;

    if (regulatory.length > 0) {
      content += `━━━ 二、监管敏感（必须关注）━━━\n`;
      regulatory.forEach((s, i) => {
        content += `  ${i + 1}. 【${statusLabels[s.status]}】${s.title}\n`;
        content += `     来源：${s.source} | 热度：${s.heat} | ${formatTime(s.publishTime)}\n`;
        content += `     命中：${summarizeHits(s)}\n`;
        if (s.responseNote) content += `     口径：${s.responseNote}\n`;
        content += `\n`;
      });
    }

    if (stock.length > 0) {
      content += `━━━ 三、股价联动（影响开盘）━━━\n`;
      stock.forEach((s, i) => {
        content += `  ${i + 1}. 【${statusLabels[s.status]}】${s.title}\n`;
        content += `     来源：${s.source} | 热度：${s.heat}\n`;
        if (s.responseNote) content += `     口径：${s.responseNote}\n`;
        content += `\n`;
      });
    }

    if (verified.length > 0) {
      content += `━━━ 四、待核实事项（需跟进）━━━\n`;
      verified.forEach((s, i) => {
        content += `  ${i + 1}. ${s.title}\n`;
        content += `     核实进度：${s.responseNote || '暂无记录'} | 标记时间：${formatTime(s.responseTime)}\n\n`;
      });
    }

    content += `━━━ 五、今日早会关注要点 ━━━\n`;
    if (regulatory.length > 0) content += `  • 务必回应监管类 ${regulatory.length} 条，避免遗漏问询函回复时限\n`;
    if (pending.length > 0) content += `  • 待处置 ${pending.length} 条，请优先处理高热度项\n`;
    if (verified.length > 0) content += `  • 待核实 ${verified.length} 条，需安排相关部门确认\n`;
    content += `  • 建议关注 9:15-9:25 集合竞价阶段股价异动\n`;
  }

  if (period === 'noon') {
    content += `【午间复盘·投资者沟通】\n`;
    content += `本时段重点：投资者提问回复 + 上午舆情变化跟踪\n\n`;

    content += `一、上午处置进度\n`;
    content += `  已处置：${replied.length + ignored.length} / ${total}（${disposalRate}%）\n`;
    content += `  待回复投资者提问：${investor.filter((s) => s.status === 'pending').length} 条\n`;
    content += `  待核实：${verified.length} 条\n\n`;

    if (investor.length > 0) {
      content += `━━━ 二、投资者集中提问（需重点回复）━━━\n`;
      const sortedInvestor = [...investor].sort((a, b) => b.heat - a.heat);
      sortedInvestor.forEach((s, i) => {
        content += `  ${i + 1}. 【${statusLabels[s.status]}】${s.title}\n`;
        content += `     平台：${s.source} | 热度：${s.heat} | 命中：${summarizeHits(s)}\n`;
        if (s.status === 'replied') {
          content += `     ✅ 回复口径：${s.responseNote}\n`;
        } else {
          content += `     ⚠️ 建议回复：参考公司近期公告口径，准确回应投资者关切\n`;
        }
        content += `\n`;
      });
    }

    if (regulatory.filter((s) => s.status === 'pending').length > 0) {
      content += `━━━ 三、仍待处理的监管事项 ━━━\n`;
      regulatory
        .filter((s) => s.status === 'pending')
        .forEach((s, i) => {
          content += `  ${i + 1}. ${s.title}\n`;
          content += `     建议：下午安排法务/财务部门专项讨论\n\n`;
        });
    }

    if (stock.filter((s) => s.status === 'pending').length > 0) {
      content += `━━━ 四、待关注股价联动事项 ━━━\n`;
      stock
        .filter((s) => s.status === 'pending')
        .forEach((s, i) => {
          content += `  ${i + 1}. ${s.title}\n     关注下午盘面变化\n\n`;
        });
    }

    content += `━━━ 五、午间复盘提示 ━━━\n`;
    content += `  • 互动易、上证e互动回复建议在 15:00 前完成\n`;
    content += `  • 下午关注 13:00-14:30 是否有新的舆情涌现\n`;
    content += `  • 已回复口径请同步至公司口径库，保持对外一致性\n`;
  }

  if (period === 'close') {
    content += `【收盘后·全天总结】\n`;
    content += `本时段重点：已处理事项复盘 + 未完成事项部署 + 次日关注提示\n\n`;

    content += `一、全天处置总结\n`;
    content += `  舆情总数：${total} 条\n`;
    content += `  ✅ 已回复：${replied.length} 条\n`;
    content += `  🔍 待核实：${verified.length} 条\n`;
    content += `  —  无需处理：${ignored.length} 条\n`;
    content += `  ⚠️ 待处置：${pending.length} 条\n`;
    content += `  📊 今日处置率：${disposalRate}%\n\n`;

    content += `━━━ 二、已处理事项复盘 ━━━\n`;
    const done = [...replied, ...ignored];
    if (done.length > 0) {
      done.forEach((s, i) => {
        content += `  ${i + 1}. 【${statusLabels[s.status]}】${s.title}\n`;
        content += `     分级：${levelLabels[s.level]} | 热度：${s.heat}\n`;
        if (s.responseNote) content += `     口径：${s.responseNote}\n`;
        if (s.disposalHistory && s.disposalHistory.length > 1) {
          content += `     流转记录：${s.disposalHistory.map((r) => statusLabels[r.status]).join(' → ')}\n`;
        }
        content += `\n`;
      });
    } else {
      content += `  （今日无已处理事项）\n\n`;
    }

    if (pending.length > 0 || verified.length > 0) {
      content += `━━━ 三、未完成事项（明日跟进）━━━\n`;
      if (verified.length > 0) {
        content += `  【待核实 ${verified.length} 条】\n`;
        verified.forEach((s, i) => {
          content += `    ${i + 1}. ${s.title}\n`;
          content += `       当前状态：${s.responseNote || '核实中'} | 建议：明日上午前给出结论\n`;
        });
        content += `\n`;
      }
      if (pending.length > 0) {
        content += `  【待处置 ${pending.length} 条】\n`;
        pending
          .sort((a, b) => b.heat - a.heat)
          .slice(0, 5)
          .forEach((s, i) => {
            content += `    ${i + 1}. 【${levelLabels[s.level]}】${s.title}\n`;
            content += `       热度：${s.heat} | 来源：${s.source}\n`;
          });
        if (pending.length > 5) {
          content += `    ...其余 ${pending.length - 5} 条请查看盯盘页\n`;
        }
        content += `\n`;
      }
    }

    content += `━━━ 四、命中关键词分布 ━━━\n`;
    const hitTypeCount: Record<string, number> = {};
    sentiments.forEach((s) => {
      s.matchHits.forEach((h) => {
        const label = matchTypeLabels[h.type];
        hitTypeCount[label] = (hitTypeCount[label] || 0) + 1;
      });
    });
    Object.entries(hitTypeCount).forEach(([type, count]) => {
      content += `  ${type}：${count} 条次\n`;
    });
    content += `\n`;

    content += `━━━ 五、次日关注提示 ━━━\n`;
    content += `  • 待核实事项请在明日开盘前核实完毕\n`;
    content += `  • 关注今晚外盘、政策新闻是否涉及公司业务\n`;
    content += `  • 已回复口径整理归档，作为后续回复参考\n`;
    if (pending.length > 0) content += `  • 明日开盘前重点回看 ${pending.length} 条待处置舆情\n`;
  }

  content += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  content += `本简报由舆情盯盘台自动生成，仅供内部参考\n`;
  content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`;

  return content;
}
