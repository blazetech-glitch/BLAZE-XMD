const { blazetz } = require('../../devblaze/blazetz');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const STATUS_JID = 'status@broadcast';

blazetz({
  nomCom: 'tostatus',
  alias: ['statuspost', 'poststatus'],
  desc: 'Post text or replied image/video media to WhatsApp Status.',
  categorie: 'General',
  reaction: '📢'
}, async (dest, client, { ms, arg, repondre, superUser }) => {
  if (!superUser) {
    return repondre('❌ This command is restricted to the bot owner.');
  }

  const text = arg.join(' ').trim();
  const quoted = getQuotedMessage(ms);
  const media = unwrapMessage(quoted);
  const mediaType = detectMediaType(media);

  if (!text && !mediaType) {
    return repondre(
      '📢 *TO STATUS USAGE*\n\n' +
      '• Text: `.tostatus Your status text`\n' +
      '• Media: Reply to an image or video with `.tostatus [optional caption]`'
    );
  }

  try {
    await repondre('⏳ Posting to WhatsApp Status...');

    if (mediaType) {
      const buffer = await downloadMedia(media, mediaType);
      if (!buffer.length) throw new Error('The replied media could not be downloaded.');

      await client.sendMessage(STATUS_JID, {
        [mediaType]: buffer,
        ...(text ? { caption: text } : {})
      });
    } else {
      await client.sendMessage(STATUS_JID, { text });
    }

    return repondre(`✅ ${mediaType ? mediaType[0].toUpperCase() + mediaType.slice(1) : 'Text'} status posted successfully.`);
  } catch (error) {
    console.error('[ToStatus] post failed:', error?.message || error);
    return repondre('❌ Failed to post the status. Check the bot session and try again.');
  }
});

function getQuotedMessage(message) {
  return message?.message?.extendedTextMessage?.contextInfo?.quotedMessage
    || message?.message?.imageMessage?.contextInfo?.quotedMessage
    || message?.message?.videoMessage?.contextInfo?.quotedMessage
    || null;
}

function unwrapMessage(message) {
  let current = message;
  for (let i = 0; i < 4; i += 1) {
    const wrapper = current?.viewOnceMessageV2
      || current?.viewOnceMessage
      || current?.viewOnceMessageV2Extension
      || current?.documentWithCaptionMessage;
    if (!wrapper?.message) break;
    current = wrapper.message;
  }
  return current;
}

function detectMediaType(message) {
  if (!message || typeof message !== 'object') return null;
  if (message.imageMessage) return 'image';
  if (message.videoMessage) return 'video';
  return null;
}

async function downloadMedia(message, type) {
  const mediaMessage = message[`${type}Message`];
  const stream = await downloadContentFromMessage(mediaMessage, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
