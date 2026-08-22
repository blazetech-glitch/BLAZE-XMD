'use strict';

const { getSettings, updateSetting } = require('../database/db');

const BIOS_KEY = 'BLAZE_USER_BIOS';
const MAX_BIOS = 200;
const MAX_BIO_LENGTH = 280;

function normalizeJid(jid) {
  return String(jid || '').split('@')[0].split(':')[0].trim();
}

function extractQuotedText(message) {
  return String(
    message?.conversation
      || message?.extendedTextMessage?.text
      || message?.imageMessage?.caption
      || message?.videoMessage?.caption
      || message?.documentMessage?.caption
      || message?.audioMessage?.caption
      || ''
  ).trim();
}

async function readBios() {
  const settings = await getSettings();
  try {
    const parsed = JSON.parse(settings[BIOS_KEY] || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry && entry.jid && entry.bio).slice(-MAX_BIOS)
      : [];
  } catch {
    return [];
  }
}

async function setBio({ jid, name, bio }) {
  const normalizedJid = normalizeJid(jid);
  const cleanBio = String(bio || '').replace(/\s+/g, ' ').trim().slice(0, MAX_BIO_LENGTH);
  if (!normalizedJid || !cleanBio) return null;

  const bios = await readBios();
  const next = bios.filter((entry) => entry.jid !== normalizedJid);
  next.push({
    jid: normalizedJid,
    name: String(name || normalizedJid).trim().slice(0, 60),
    bio: cleanBio,
    updatedAt: new Date().toISOString()
  });
  await updateSetting(BIOS_KEY, JSON.stringify(next.slice(-MAX_BIOS)));
  return next.at(-1);
}

async function removeBio(jid) {
  const normalizedJid = normalizeJid(jid);
  const bios = await readBios();
  const next = bios.filter((entry) => entry.jid !== normalizedJid);
  if (next.length !== bios.length) await updateSetting(BIOS_KEY, JSON.stringify(next));
  return next.length !== bios.length;
}

async function getBio(jid) {
  const normalizedJid = normalizeJid(jid);
  return (await readBios()).find((entry) => entry.jid === normalizedJid) || null;
}

async function listBios() {
  return (await readBios()).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

module.exports = { extractQuotedText, getBio, listBios, normalizeJid, removeBio, setBio };
