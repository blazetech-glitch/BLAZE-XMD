const { getSettings, updateSetting } = require('../database/db');

const KEY = 'BLAZE_AUTO_CONTACTS';
const cache = new Map();
const pending = new Map();

function normalize(value) {
  const state = value && typeof value === 'object' ? value : {};
  const contacts = state.contacts && typeof state.contacts === 'object' ? { ...state.contacts } : {};
  for (const jid of Array.isArray(state.sent) ? state.sent : []) {
    const clean = String(jid || '').trim();
    if (clean && !contacts[clean]) {
      contacts[clean] = { name: 'New Contact • BLAZE TECH', addedAt: Date.now() };
    }
  }
  const bounded = Object.fromEntries(Object.entries(contacts)
    .filter(([jid, contact]) => jid.includes('@') && contact && typeof contact === 'object')
    .slice(-5000)
    .map(([jid, contact]) => [jid, {
      name: String(contact.name || 'New Contact • BLAZE TECH').slice(0, 80),
      addedAt: Number(contact.addedAt || Date.now())
    }]));
  return { enabled: state.enabled === 'on' ? 'on' : 'off', contacts: bounded };
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

async function shouldRegisterAutoContact(jid) {
  const state = await getAutoContactState();
  return state.enabled === 'on' && jid && !state.contacts[jid];
}

async function registerAutoContact(jid, name = 'New Contact • BLAZE TECH') {
  if (!jid) return null;
  const state = await getAutoContactState();
  if (!state.contacts[jid]) {
    state.contacts[jid] = { name: String(name).slice(0, 80), addedAt: Date.now() };
    const entries = Object.entries(state.contacts).slice(-5000);
    state.contacts = Object.fromEntries(entries);
    persist(state);
  }
  return state.contacts[jid];
}

async function getAutoContacts() {
  const state = await getAutoContactState();
  return Object.entries(state.contacts).map(([jid, contact]) => ({ jid, ...contact }));
}

module.exports = {
  getAutoContactState,
  setAutoContactEnabled,
  shouldRegisterAutoContact,
  registerAutoContact,
  getAutoContacts
};
