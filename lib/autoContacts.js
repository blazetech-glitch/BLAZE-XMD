const { getSettings, updateSetting } = require('../database/db');

const KEY = 'BLAZE_AUTO_CONTACTS';
const cache = new Map();
const pending = new Map();

function normalize(value) {
  const state = value && typeof value === 'object' ? value : {};
  const sent = Array.isArray(state.sent)
    ? [...new Set(state.sent.map((jid) => String(jid).trim()).filter((jid) => jid.includes('@')))].slice(-5000)
    : [];
  return { enabled: state.enabled === 'on' ? 'on' : 'off', sent };
}

async function getAutoContactState() {
  if (cache.has(KEY)) return cache.get(KEY);
  const settings = await getSettings();
  let parsed = {};
  try { parsed = JSON.parse(settings[KEY] || '{}'); } catch {}
  const state = normalize(parsed);
  cache.set(KEY, state);
  return state;
}

function persist(state) {
  if (pending.has(KEY)) clearTimeout(pending.get(KEY));
  pending.set(KEY, setTimeout(async () => {
    pending.delete(KEY);
    try { await updateSetting(KEY, JSON.stringify(state)); } catch (error) {
      console.error('[Auto contact] persistence failed:', error.message || error);
    }
  }, 250));
}

async function setAutoContactEnabled(enabled) {
  const state = await getAutoContactState();
  state.enabled = enabled ? 'on' : 'off';
  persist(state);
  return state.enabled;
}

async function shouldSendAutoContact(jid) {
  const state = await getAutoContactState();
  return state.enabled === 'on' && jid && !state.sent.includes(jid);
}

async function markAutoContactSent(jid) {
  if (!jid) return;
  const state = await getAutoContactState();
  if (!state.sent.includes(jid)) {
    state.sent.push(jid);
    state.sent = state.sent.slice(-5000);
    persist(state);
  }
}

module.exports = { getAutoContactState, setAutoContactEnabled, shouldSendAutoContact, markAutoContactSent };
