const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const RETRIEVE_EMOJIS = new Set(['👁️', '👁️‍🗨️', '📥']);

function unwrapMessage(message) {
  if (!message) return null;
  if (message.ephemeralMessage?.message) return unwrapMessage(message.ephemeralMessage.message);
  if (message.documentWithCaptionMessage?.message) return unwrapMessage(message.documentWithCaptionMessage.message);
  return message;
}

function getMedia(message) {
  const content = unwrapMessage(message);
  if (!content) return null;
  if (content.viewOnceMessage || content.viewOnceMessageV2 || content.viewOnceMessageV2Extension) {
    return { protected: true };
  }
  if (content.imageMessage) return { type: 'image', payload: content.imageMessage };
  if (content.videoMessage) return { type: 'video', payload: content.videoMessage };
  return null;
}

function normalizeJid(jid) {
  return jid ? String(jid).replace(/:.*(?=@)/, '').trim() : '';
}

function getSenderJid(message) {
  const remoteJid = normalizeJid(message.key?.remoteJid);
  const participant = normalizeJid(message.key?.participant || message.participant);
  if (remoteJid.endsWith('@g.us')) return participant;
  return remoteJid;
}

function getText(message) {
  return String(
    message.message?.conversation
      || message.message?.extendedTextMessage?.text
      || ''
  ).trim();
}

async function downloadMedia(payload, type) {
  const stream = await downloadContentFromMessage(payload, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function handleEmojiRetrieve(client, message) {
  if (!message?.message || message.key?.fromMe) return false;
  const trigger = getText(message);
  if (!RETRIEVE_EMOJIS.has(trigger)) return false;

  const quoted = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
  const media = getMedia(quoted);
  const chatJid = normalizeJid(message.key?.remoteJid);
  const senderJid = getSenderJid(message);

  if (!media) {
    await client.sendMessage(chatJid, { text: '❌ Reply with 👁️ to an accessible regular image or video.' }, { quoted: message });
    return true;
  }
  if (media.protected) {
    await client.sendMessage(chatJid, { text: '❌ View Once media cannot be retrieved or bypassed.' }, { quoted: message });
    return true;
  }
  if (!senderJid || (!senderJid.endsWith('@s.whatsapp.net') && !senderJid.endsWith('@lid'))) {
    await client.sendMessage(chatJid, { text: '❌ Could not determine your private WhatsApp JID.' }, { quoted: message });
    return true;
  }

  try {
    const buffer = await downloadMedia(media.payload, media.type);
    if (!buffer.length) throw new Error('empty media');
    await client.sendMessage(senderJid, {
      [media.type]: buffer,
      caption: '👁️ Retrieved media\n\n© BLAZE XMD'
    });
    await client.sendMessage(chatJid, { text: '✅ Media sent to your private chat.' }, { quoted: message });
  } catch (error) {
    console.error('[emoji-retrieve]', error);
    await client.sendMessage(chatJid, { text: '❌ Failed to retrieve the media.' }, { quoted: message });
  }
  return true;
}

module.exports = { handleEmojiRetrieve, RETRIEVE_EMOJIS };
