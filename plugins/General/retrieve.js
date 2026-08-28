const { blazetz } = require('../../devblaze/blazetz');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function unwrapMessage(message) {
  if (!message) return null;
  if (message.ephemeralMessage?.message) return unwrapMessage(message.ephemeralMessage.message);
  if (message.documentWithCaptionMessage?.message) return unwrapMessage(message.documentWithCaptionMessage.message);
  return message;
}

function findMedia(message) {
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
  if (!jid) return '';
  return String(jid).replace(/:.*(?=@)/, '').trim();
}

function getSenderJid(response, dest) {
  const { auteurMessage, ms } = response;
  const candidate = auteurMessage || ms?.key?.participant || ms?.participant;
  const sender = normalizeJid(candidate);
  if (sender && (sender.endsWith('@s.whatsapp.net') || sender.endsWith('@lid'))) return sender;

  const chat = normalizeJid(dest);
  if (!chat.endsWith('@g.us') && (chat.endsWith('@s.whatsapp.net') || chat.endsWith('@lid'))) return chat;
  return '';
}

async function downloadMedia(payload, type) {
  const stream = await downloadContentFromMessage(payload, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

blazetz({
  nomCom: 'retrieve',
  alias: ['retrievetopm', 'sendtopm'],
  desc: 'Retrieve accessible replied media to your private chat.',
  categorie: 'General',
  reaction: '👁️'
}, async (dest, client, response) => {
  const { ms, msgRepondu, repondre } = response;

  try {
    if (!ms || !msgRepondu) {
      return repondre('👁️ Reply to an accessible regular image or video with .retrieve.');
    }

    const media = findMedia(msgRepondu);
    if (media?.protected) {
      return repondre('❌ View Once media cannot be retrieved or bypassed. Reply to a regular image or video instead.');
    }
    if (!media) return repondre('❌ Reply to an accessible regular image or video.');

    const userJid = getSenderJid(response, dest);
    if (!userJid) return repondre("❌ Couldn't determine your private WhatsApp JID.");

    const buffer = await downloadMedia(media.payload, media.type);
    if (!buffer.length) return repondre("❌ The media isn't available to the bot.");

    const outgoing = {
      [media.type]: buffer,
      caption: '👁️ Retrieved media\n\n© BLAZE XMD'
    };
    await client.sendMessage(userJid, outgoing);
    return;
  } catch (error) {
    console.error('[retrieve-to-pm]', error);
    return repondre('❌ Failed to retrieve the media.');
  }
});
