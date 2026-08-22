const { getSettings, updateSetting } = require('../database/db');

const cache = new Map();
const pending = new Map();
const KEY_PREFIX = 'BLAZE_GROUP_MOD_';

function keyFor(jid) {
  return `${KEY_PREFIX}${jid}`;
}

function emptyState() {
  return { antiBadWords: 'off', badWords: [], activity: {} };
}

function normalizeState(value) {
  const state = value && typeof value === 'object' ? value : {};
  const badWords = Array.isArray(state.badWords)
    ? [...new Set(state.badWords.map((word) => String(word).trim().toLowerCase()).filter(Boolean))].slice(0, 200)
    : [];
  const activity = state.activity && typeof state.activity === 'object' ? state.activity : {};
  return {
    antiBadWords: state.antiBadWords === 'on' ? 'on' : 'off',
    badWords,
    activity
  };
}

async function getState(jid) {
  if (cache.has(jid)) return cache.get(jid);
  const settings = await getSettings();
  let parsed = emptyState();
  try {
    parsed = JSON.parse(settings[keyFor(jid)] || '{}');
  } catch {}
  const state = normalizeState(parsed);
  cache.set(jid, state);
  return state;
}

function persist(jid, state) {
  if (pending.has(jid)) clearTimeout(pending.get(jid));
  const timer = setTimeout(async () => {
    pending.delete(jid);
    try {
      await updateSetting(keyFor(jid), JSON.stringify(state));
    } catch (error) {
      console.error('[Group moderation] persistence failed:', error.message);
    }
  }, 250);
  pending.set(jid, timer);
}

async function setAntiBadWords(jid, enabled) {
  const state = await getState(jid);
  state.antiBadWords = enabled ? 'on' : 'off';
  persist(jid, state);
  return state.antiBadWords;
}

async function addBadWord(jid, word) {
  const clean = String(word || '').trim().toLowerCase();
  if (!clean || clean.length > 60 || /\s/.test(clean)) return false;
  const state = await getState(jid);
  if (!state.badWords.includes(clean)) state.badWords.push(clean);
  state.badWords = state.badWords.slice(0, 200);
  persist(jid, state);
  return true;
}

async function getBadWords(jid) {
  return (await getState(jid)).badWords;
}

async function recordGroupMessage(jid, senderJid) {
  if (!jid || !senderJid) return;
  const state = await getState(jid);
  const current = state.activity[senderJid] || { messages: 0, lastSeen: 0 };
  current.messages = Number(current.messages || 0) + 1;
  current.lastSeen = Date.now();
  state.activity[senderJid] = current;
  persist(jid, state);
}

async function getActiveMembers(jid) {
  const state = await getState(jid);
  return Object.entries(state.activity)
    .map(([jidValue, value]) => ({ jid: jidValue, messages: Number(value?.messages || 0), lastSeen: Number(value?.lastSeen || 0) }))
    .sort((a, b) => b.messages - a.messages || b.lastSeen - a.lastSeen);
}

async function findBadWord(jid, text) {
  const state = await getState(jid);
  if (state.antiBadWords !== 'on' || !text) return null;
  const normalized = String(text).toLowerCase();
  return state.badWords.find((word) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}([^a-z0-9]|$)`, 'i').test(normalized)) || null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  addBadWord,
  findBadWord,
  getActiveMembers,
  getBadWords,
  getState,
  recordGroupMessage,
  setAntiBadWords
};
