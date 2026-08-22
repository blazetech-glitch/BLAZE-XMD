const { blazetz } = require('../../devblaze/blazetz');
const { clearStatusHistory, getStatusAnalytics } = require('../../lib/statusHistory');

blazetz({
  nomCom: 'statushistory',
  alias: ['statusanalytics', 'statusstats', 'statuslog'],
  desc: 'View analytics and recent history for statuses posted by the bot.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '📊'
}, async (dest, client, { repondre, superUser, arg }) => {
  if (!superUser) {
    return repondre('❌ This command is restricted to the bot owner.');
  }

  try {
    const analytics = await getStatusAnalytics();
    if (!analytics.total) {
      return repondre('📊 No status history has been recorded yet.');
    }

    const typeSummary = Object.entries(analytics.byType)
      .map(([type, count]) => `• ${type}: ${count}`)
      .join('\n');
    const recent = analytics.recent
      .slice(0, 10)
      .map((item, index) => {
        const label = item.type === 'audio' && item.voiceNote ? 'voice note' : item.type;
        const caption = item.captionLength ? `, caption ${item.captionLength} chars` : '';
        return `${index + 1}. ${label}${caption} — ${formatDate(item.postedAt)}`;
      })
      .join('\n');

    const clearRequest = String(arg?.[0] || '').toLowerCase() === 'clear';
    if (clearRequest) {
      await clearStatusHistory();
      return repondre('✅ Status history has been cleared. Future status posts will be recorded normally.');
    }

    return repondre(
      `📊 *BLAZE XMD STATUS ANALYTICS*\n\n` +
      `Total posted: *${analytics.total}*\n` +
      `Voice notes: *${analytics.voiceNotes}*\n` +
      `First recorded: *${formatDate(analytics.firstPostedAt)}*\n` +
      `Last recorded: *${formatDate(analytics.lastPostedAt)}*\n\n` +
      `*BY TYPE*\n${typeSummary}\n\n` +
      `*RECENT HISTORY*\n${recent}`
    );
  } catch (error) {
    console.error('[StatusHistory] analytics failed:', error?.message || error);
    return repondre('❌ Status analytics are temporarily unavailable.');
  }
});

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
