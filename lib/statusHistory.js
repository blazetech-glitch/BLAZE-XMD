const { getSettings, updateSetting } = require('../database/db');

const HISTORY_KEY = 'BLAZE_STATUS_HISTORY';
const MAX_ENTRIES = 200;

async function readHistory() {
  const settings = await getSettings();
  try {
    const parsed = JSON.parse(settings[HISTORY_KEY] || '[]');
    return Array.isArray(parsed) ? parsed.filter(isValidEntry).slice(-MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

async function recordStatus(entry) {
  const history = await readHistory();
  history.push({
    type: String(entry.type || 'text'),
    voiceNote: Boolean(entry.voiceNote),
    captionLength: Number(entry.captionLength || 0),
    postedAt: new Date().toISOString()
  });
  await updateSetting(HISTORY_KEY, JSON.stringify(history.slice(-MAX_ENTRIES)));
  return history.length;
}

async function getStatusAnalytics() {
  const history = await readHistory();
  const byType = history.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] || 0) + 1;
    return counts;
  }, {});
  const voiceNotes = history.filter((item) => item.type === 'audio' && item.voiceNote).length;
  const last = history.at(-1) || null;

  return {
    total: history.length,
    byType,
    voiceNotes,
    firstPostedAt: history[0]?.postedAt || null,
    lastPostedAt: last?.postedAt || null,
    recent: history.slice(-10).reverse()
  };
}

function isValidEntry(entry) {
  return Boolean(entry && typeof entry === 'object' && entry.postedAt && entry.type);
}

module.exports = { getStatusAnalytics, recordStatus };
