const { blazetz } = require('../../devblaze/blazetz');
const { extractQuotedText, getBio, listBios, normalizeJid, removeBio, setBio } = require('../../lib/bios');

function displayName(entry) {
  return String(entry.name || entry.jid || 'Unknown').replace(/[\n\r]/g, ' ').slice(0, 42);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderEntry(entry, index) {
  return `┃ *${String(index + 1).padStart(2, '0')} · ${displayName(entry)}*\n┃   “${entry.bio}”\n┃   ${formatDate(entry.updatedAt)}`;
}

blazetz({
  nomCom: 'bio',
  alias: ['bios', 'aboutme'],
  desc: 'Set, view, list, or remove user bios.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '🪪'
}, async (dest, client, options) => {
  const { arg = [], ms, msgRepondu, auteurMessage, nomAuteurMessage, repondre } = options;
  const userJid = normalizeJid(auteurMessage || ms?.key?.participant || ms?.key?.remoteJid || dest);
  const action = String(arg[0] || 'view').toLowerCase();

  if (['help', '?'].includes(action)) {
    return repondre([
      '🪪 *BLAZE XMD BIOS*',
      '',
      '`.bio set Your bio text` — save your own bio',
      'Reply to a message with `.bio set` — save that text as your bio',
      '`.bio` — view your current bio',
      '`.bio list` — view the beautiful dated bio list',
      '`.bio remove` — remove your bio'
    ].join('\n'));
  }

  if (action === 'list' || action === 'all') {
    const bios = await listBios();
    if (!bios.length) return repondre('🪪 *BLAZE XMD BIOS*\n\nNo bios have been added yet.');
    return repondre([
      '╭━━━〔 🪪 *BLAZE XMD BIOS* 〕━━━╮',
      ...bios.slice(0, 20).map(renderEntry),
      '╰━━━〔 ARNOLDT20 · Updated profiles 〕━━━╯'
    ].join('\n'));
  }

  if (['remove', 'delete', 'clear'].includes(action)) {
    const removed = await removeBio(userJid);
    return repondre(removed ? '✅ Your BLAZE XMD bio has been removed.' : 'ℹ️ You do not have a saved bio yet.');
  }

  if (['set', 'add', 'update'].includes(action)) {
    const quotedText = extractQuotedText(msgRepondu);
    const bioText = arg.slice(1).join(' ').trim() || quotedText;
    if (!bioText) return repondre('🪪 Add text after `.bio set` or reply to a text message with `.bio set`.');
    if (bioText.length > 280) return repondre('❌ Keep your bio within 280 characters.');
    const saved = await setBio({ jid: userJid, name: nomAuteurMessage || userJid, bio: bioText });
    if (!saved) return repondre('❌ I could not save that bio.');
    return repondre([
      '╭━━━〔 ✅ *BIO UPDATED* 〕━━━╮',
      `┃ *${String(saved.name).slice(0, 42)}*`,
      `┃ “${saved.bio}”`,
      `┃ ${formatDate(saved.updatedAt)} · BLAZE XMD`,
      '╰━━━〔 ARNOLDT20 〕━━━╯'
    ].join('\n'));
  }

  const current = await getBio(userJid);
  if (!current) return repondre('🪪 You have no saved bio yet. Use `.bio set Your bio text`.');
  return repondre([
    '╭━━━〔 🪪 *YOUR BLAZE XMD BIO* 〕━━━╮',
    `┃ *${String(current.name).slice(0, 42)}*`,
    `┃ “${current.bio}”`,
    `┃ ${formatDate(current.updatedAt)}`,
    '╰━━━〔 ARNOLDT20 〕━━━╯'
  ].join('\n'));
});
