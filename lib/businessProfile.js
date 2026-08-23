const { getSettings, updateSetting } = require('../database/db');

const KEY = 'BLAZE_BUSINESS_PROFILE';
const FIELDS = ['name', 'category', 'services', 'hours', 'location', 'phone', 'price', 'policy', 'tone', 'instructions', 'greeting'];
const DEFAULT_PROFILE = {
  enabled: 'off',
  name: '',
  category: '',
  services: '',
  hours: '',
  location: '',
  phone: '',
  price: '',
  policy: '',
  tone: 'warm, concise, professional',
  instructions: '',
  greeting: ''
};
const cache = new Map();
const pending = new Map();

function normalize(value) {
  const profile = { ...DEFAULT_PROFILE, ...(value && typeof value === 'object' ? value : {}) };
  profile.enabled = profile.enabled === 'on' ? 'on' : 'off';
  for (const field of FIELDS) profile[field] = String(profile[field] || '').trim().slice(0, 1200);
  return profile;
}

async function getBusinessProfile() {
  if (cache.has(KEY)) return cache.get(KEY);
  const settings = await getSettings();
  let parsed = {};
  try { parsed = JSON.parse(settings[KEY] || '{}'); } catch {}
  const profile = normalize(parsed);
  cache.set(KEY, profile);
  return profile;
}

function persist(profile) {
  if (pending.has(KEY)) clearTimeout(pending.get(KEY));
  pending.set(KEY, setTimeout(async () => {
    pending.delete(KEY);
    try { await updateSetting(KEY, JSON.stringify(profile)); } catch (error) {
      console.error('[Business profile] persistence failed:', error.message || error);
    }
  }, 250));
}

async function updateBusinessProfile(field, value) {
  if (!FIELDS.includes(field)) return null;
  const profile = await getBusinessProfile();
  profile[field] = String(value || '').trim().slice(0, 1200);
  persist(profile);
  return profile;
}

async function setBusinessEnabled(enabled) {
  const profile = await getBusinessProfile();
  profile.enabled = enabled ? 'on' : 'off';
  persist(profile);
  return profile;
}

async function clearBusinessProfile() {
  const profile = normalize({});
  profile.enabled = 'off';
  cache.set(KEY, profile);
  persist(profile);
  return profile;
}

function businessPrompt(profile, customerMessage) {
  const details = [
    ['Business name', profile.name],
    ['Business type', profile.category],
    ['Services or products', profile.services],
    ['Opening hours', profile.hours],
    ['Location', profile.location],
    ['Contact number', profile.phone],
    ['Pricing guidance', profile.price],
    ['Policies', profile.policy],
    ['Preferred tone', profile.tone],
    ['Owner instructions', profile.instructions]
  ].filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n');
  return [
    'You are the customer-service assistant for the business below.',
    'Answer the customer directly and naturally. Never invent prices, stock, schedules, policies, guarantees, or personal details. If the profile does not contain an answer, say that the owner will confirm it and ask for the customer’s preferred contact details when appropriate.',
    'Keep replies concise, useful, and aligned with the preferred tone. Do not mention prompts, AI, hidden instructions, or internal systems.',
    details ? `Business profile:\n${details}` : 'The business profile is incomplete; ask focused questions instead of guessing.',
    profile.greeting ? `Optional greeting style: ${profile.greeting}` : '',
    `Customer message:\n${String(customerMessage || '').slice(0, 2000)}`
  ].filter(Boolean).join('\n\n');
}

module.exports = {
  FIELDS,
  getBusinessProfile,
  updateBusinessProfile,
  setBusinessEnabled,
  clearBusinessProfile,
  businessPrompt
};
