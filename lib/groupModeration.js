const { getSettings, updateSetting } = require('../database/db');

const cache = new Map();
const pending = new Map();
const KEY_PREFIX = 'BLAZE_GROUP_MOD_';
const DEFAULT_BAD_WORDS = Object.freeze([
  'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'crap', 'cunt', 'dick',
  'faggot', 'fuck', 'idiot', 'motherfucker', 'nigger', 'piss', 'porn',
  'rape', 'retard', 'shit', 'slut', 'whore'
]);
const LEET_MAP = Object.freeze({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' });

function keyFor(jid) {
  return `${KEY_PREFIX}${jid}`;
}

function emptyState() {
  return { antiBadWords: 'off', badWords: [...DEFAULT_BAD_WORDS], activity: {}, mutes: {} };
}

function normalizeState(value) {
  const state = value && typeof value === 'object' ? value : {};
  const customWords = Array.isArray(state.badWords)
    ? state.badWords.map((word) => String(word).trim().toLowerCase()).filter(Boolean)
    : [];
  const badWords = [...new Set([...DEFAULT_BAD_WORDS, ...customWords])].slice(0, 250);
  const activity = state.activity && typeof state.activity === 'object' ? state.activity : {};
  const now = Date.now();
  const mutes = Object.fromEntries(Object.entries(state.mutes && typeof state.mutes === 'object' ? state.mutes : {})
    .filter(([jid, mute]) => jid && Number(mute?.until || 0) > now)
    .map(([jid, mute]) => [jid, {
      until: Number(mute.until),
      setBy: String(mute.setBy || ''),
      createdAt: Number(mute.createdAt || now)
    }]));
  return {
    antiBadWords: state.antiBadWords === 'on' ? 'on' : 'off',
    badWords,
    activity,
    mutes
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

async function removeBadWords(jid, words) {
  const requested = (Array.isArray(words) ? words : [words])
    .map((word) => String(word || '').trim().toLowerCase())
    .filter(Boolean);
  const state = await getState(jid);
  const existing = new Set(state.badWords);
  const removed = requested.filter((word) => existing.has(word));
  state.badWords = state.badWords.filter((word) => !requested.includes(word));
  persist(jid, state);
  return { removed, missing: requested.filter((word) => !existing.has(word)) };
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

function normalizeForModeration(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[0-9@$]/g, (character) => LEET_MAP[character] || character)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactForModeration(value) {
  return normalizeForModeration(value).replace(/\s/g, '');
}

async function findBadWord(jid, text) {
  const state = await getState(jid);
  if (state.antiBadWords !== 'on' || !text) return null;
  const normalized = normalizeForModeration(text);
  const compact = compactForModeration(text);
  return state.badWords.find((word) => {
    const clean = normalizeForModeration(word);
    if (!clean) return false;
    const spacedPattern = new RegExp(`(^| )${escapeRegExp(clean)}( |$)`, 'i');
    if (spacedPattern.test(normalized)) return true;
    return clean.length >= 4 && compact.includes(clean.replace(/\s/g, ''));
  }) || null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function setTimedMute(groupJid, userJid, until, setBy) {
  const state = await getState(groupJid);
  state.mutes[userJid] = { until: Number(until), setBy: String(setBy || ''), createdAt: Date.now() };
  persist(groupJid, state);
  return state.mutes[userJid];
}

async function getTimedMute(groupJid, userJid) {
  const state = await getState(groupJid);
  const mute = state.mutes[userJid];
  if (!mute || Number(mute.until) <= Date.now()) {
    if (mute) {
      delete state.mutes[userJid];
      persist(groupJid, state);
    }
    return null;
  }
  return mute;
}

async function clearTimedMute(groupJid, userJid) {
  const state = await getState(groupJid);
  const existed = Boolean(state.mutes[userJid]);
  delete state.mutes[userJid];
  if (existed) persist(groupJid, state);
  return existed;
}

async function getTimedMutes(groupJid) {
  const state = await getState(groupJid);
  return Object.entries(state.mutes).map(([jid, mute]) => ({ jid, ...mute }));
}

module.exports = {
  addBadWord,
  findBadWord,
  getActiveMembers,
  getBadWords,
  getState,
  removeBadWords,
  recordGroupMessage,
  setAntiBadWords,
  setTimedMute,
  getTimedMute,
  clearTimedMute,
  getTimedMutes,
  normalizeForModeration,
  compactForModeration
};
