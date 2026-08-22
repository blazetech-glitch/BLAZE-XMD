const { blazetz } = require('../../devblaze/blazetz');

function unwrapMessage(message) {
  let current = message || {};
  for (let index = 0; index < 3; index += 1) {
    if (current.ephemeralMessage?.message) current = current.ephemeralMessage.message;
    else if (current.viewOnceMessage?.message) current = current.viewOnceMessage.message;
    else if (current.viewOnceMessageV2?.message) current = current.viewOnceMessageV2.message;
    else break;
  }
  return current;
}

function messageType(message) {
  const keys = Object.keys(unwrapMessage(message));
  return keys.find((key) => key.endsWith('Message') || key === 'conversation') || 'unknown';
}

function formatDate(value) {
  if (!value) return 'Not included in quoted message';
  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

function mediaSummary(message) {
  const current = unwrapMessage(message);
  const media = current.imageMessage || current.videoMessage || current.audioMessage || current.documentMessage || current.stickerMessage;
  if (!media) return '';
  const details = [];
  if (media.mimetype) details.push(media.mimetype);
  if (media.fileLength) details.push(`${Number(media.fileLength).toLocaleString()} bytes`);
  if (media.fileName) details.push(media.fileName);
  if (media.seconds) details.push(`${media.seconds}s`);
  return details.length ? `\n┃ Media: *${details.join(' · ')}*` : '';
}

blazetz({
  nomCom: 'info',
  alias: ['msginfo', 'messageinfo'],
  desc: 'Show concise details about a replied message.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '🔎'
}, async (dest, client, options) => {
  const { ms, msgRepondu, auteurMsgRepondu, nomAuteurMessage, repondre } = options;
  const contextInfo = ms?.message?.extendedTextMessage?.contextInfo
    || ms?.message?.imageMessage?.contextInfo
    || ms?.message?.videoMessage?.contextInfo
    || ms?.message?.documentMessage?.contextInfo;
  const target = msgRepondu || ms?.message;
  if (!target) return repondre('🔎 Reply to a message with `.info` to view its details.');

  const key = contextInfo || ms?.key || {};
  const sender = auteurMsgRepondu || key.participant || key.remoteJid || 'Unknown';
  const displayName = nomAuteurMessage || sender.split('@')[0];
  const id = key.stanzaId || key.id || ms?.key?.id || 'Unavailable';
  const mentions = contextInfo?.mentionedJid?.length || 0;
  const forwarded = contextInfo?.forwardingScore ? 'Yes' : 'No';
  const timestamp = target?.messageTimestamp || contextInfo?.quotedMessage?.messageTimestamp;
  const type = messageType(target).replace('Message', '').replace(/^./, (letter) => letter.toUpperCase());

  return repondre([
    '╭━━━〔 🔎 *BLAZE XMD INFO* 〕━━━╮',
    `┃ From: *${String(displayName).slice(0, 40)}*`,
    `┃ JID: \`${sender}\``,
    `┃ Type: *${type}*`,
    `┃ ID: \`${id}\``,
    `┃ Date: *${formatDate(timestamp)}*`,
    `┃ Mentions: *${mentions}* · Forwarded: *${forwarded}*${mediaSummary(target)}`,
    '╰━━━〔 ARNOLDT20 〕━━━╯'
  ].join('\n'));
});
