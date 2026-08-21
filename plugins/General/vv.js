const { blazetz } = require('../../devblaze/blazetz');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const conf = require('../../settings');

function unwrapQuotedMessage(message) {
  if (!message) return null;
  if (message.ephemeralMessage?.message) return unwrapQuotedMessage(message.ephemeralMessage.message);
  if (message.documentWithCaptionMessage?.message) return unwrapQuotedMessage(message.documentWithCaptionMessage.message);
  return message;
}

function getAccessibleMedia(message) {
  const content = unwrapQuotedMessage(message);
  if (!content) return null;

  if (content.viewOnceMessage || content.viewOnceMessageV2 || content.viewOnceMessageV2Extension) {
    return { protected: true };
  }

  if (content.imageMessage) return { type: 'image', payload: content.imageMessage };
  if (content.videoMessage) return { type: 'video', payload: content.videoMessage };
  return null;
}

async function collectMedia(payload, type) {
  const stream = await downloadContentFromMessage(payload, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

blazetz({
  nomCom: 'vv',
  alias: ['viewmedia', 'getmedia'],
  desc: 'Retrieve accessible replied image or video media.',
  categorie: 'General',
  reaction: '👁️'
}, async (dest, client, response) => {
  const { ms, msgRepondu, repondre } = response;
  const prefixe = conf.PREFIXE || '.';

  try {
    if (!ms || !msgRepondu) {
      return repondre(`👁️ *VIEW MEDIA*\n\nReply to an accessible image or video with *${prefixe}vv*.`);
    }

    const media = getAccessibleMedia(msgRepondu);
    if (media?.protected) {
      return repondre('❌ View Once media cannot be retrieved or bypassed. Reply to a regular image or video instead.');
    }
    if (!media) {
      return repondre('❌ Please reply to an accessible regular image or video.');
    }

    const buffer = await collectMedia(media.payload, media.type);
    if (!buffer.length) return repondre('❌ No media data was available.');

    const caption = '👁️ Media retrieved successfully.\n\n© BLAZE XMD';
    if (media.type === 'image') {
      await client.sendMessage(dest, { image: buffer, caption }, { quoted: ms });
    } else {
      await client.sendMessage(dest, { video: buffer, caption }, { quoted: ms });
    }
  } catch (error) {
    console.error('[vv]', error);
    return repondre(`❌ Failed to retrieve media: ${error?.message || 'Unknown error'}`);
  }
});
