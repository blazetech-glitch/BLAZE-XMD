const fs = require('fs');
const path = require('path');

const GROUP_COOLDOWN_MS = 12_000;
const lastSentAt = new Map();
const nextIndex = new Map();
const stickerCache = new Map();

const STICKERS = {
  config: [
    'assets/group-feedback/reaction-surprised-kid.webp',
    'assets/group-feedback/reaction-dance.webp',
    'assets/group-feedback/reaction-relaxed-kid.webp'
  ],
  member: [
    'assets/group-feedback/reaction-man-smile.webp',
    'assets/group-feedback/reaction-dance.webp',
    'assets/group-feedback/reaction-grinning-pepe.webp'
  ],
  warning: [
    'assets/group-feedback/reaction-side-eye.webp',
    'assets/group-feedback/reaction-kid-peace.webp',
    'assets/group-feedback/reaction-pepe-soft.webp'
  ],
  enforcement: [
    'assets/group-feedback/reaction-pull-away.webp',
    'assets/group-feedback/reaction-sailor-pepe.webp',
    'assets/group-feedback/reaction-blanket-chimp.webp'
  ]
};

function chooseSticker(kind) {
  const category = STICKERS[kind] ? kind : 'config';
  const list = STICKERS[category];
  const index = nextIndex.get(category) || 0;
  nextIndex.set(category, (index + 1) % list.length);
  return path.join(__dirname, '..', list[index]);
}

function loadSticker(filePath) {
  if (!stickerCache.has(filePath)) {
    stickerCache.set(filePath, fs.readFileSync(filePath));
  }
  return stickerCache.get(filePath);
}

async function sendGroupFeedbackSticker(client, dest, { kind = 'config', quoted } = {}) {
  if (!client || !String(dest || '').endsWith('@g.us')) return false;

  const now = Date.now();
  if (now - (lastSentAt.get(dest) || 0) < GROUP_COOLDOWN_MS) return false;

  try {
    const sticker = loadSticker(chooseSticker(kind));
    lastSentAt.set(dest, now);
    await client.sendMessage(dest, { sticker }, quoted ? { quoted } : {});
    return true;
  } catch (error) {
    lastSentAt.delete(dest);
    console.warn('[Group feedback sticker] send failed:', error.message || error);
    return false;
  }
}

module.exports = { sendGroupFeedbackSticker };
