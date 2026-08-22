const { blazetz } = require('../../devblaze/blazetz');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { recordStatus } = require('../../lib/statusHistory');

const STATUS_JID = 'status@broadcast';

blazetz({
  nomCom: 'tostatus',
  alias: ['statuspost', 'poststatus'],
  desc: 'Post text or replied image, video, audio, or voice-note media to WhatsApp Status.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '📢'
}, async (dest, client, { ms, arg, repondre, superUser, auteurMessage }) => {
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
      '• Media: Reply to an image, video, audio, or voice note with `.tostatus [optional caption]`'
    );
  }

  try {
    await repondre('⏳ Posting to WhatsApp Status...');
    const statusOptions = buildStatusOptions(client, dest, ms, auteurMessage);
    if (!statusOptions.statusJidList.length) {
      throw new Error('No valid WhatsApp contacts are available for the status audience.');
    }

    if (mediaType) {
      const buffer = await downloadMedia(media, mediaType);
      if (!buffer.length) throw new Error('The replied media could not be downloaded.');

      const mediaMessage = media[`${mediaType}Message`];
      const payload = mediaType === 'audio'
        ? {
            audio: buffer,
            mimetype: mediaMessage.mimetype || 'audio/ogg; codecs=opus',
            ptt: Boolean(mediaMessage.ptt)
          }
        : {
            [mediaType]: buffer,
            ...(text ? { caption: text } : {})
          };

      await client.sendMessage(STATUS_JID, payload, statusOptions);
      recordStatus({
        type: mediaType,
        voiceNote: mediaType === 'audio' && Boolean(mediaMessage.ptt),
        captionLength: text.length
      }).catch((error) => console.error('[ToStatus] history record failed:', error.message));
    } else {
      await client.sendMessage(STATUS_JID, { text }, {
        ...statusOptions,
        backgroundColor: '#111827',
        font: 2
      });
      recordStatus({ type: 'text', captionLength: text.length })
        .catch((error) => console.error('[ToStatus] history record failed:', error.message));
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
  if (message.audioMessage) return 'audio';
  return null;
}

function buildStatusOptions(client, dest, message, senderJid) {
  const botJid = normalizeUserJid(client?.user?.id);
  const requesterJid = normalizeUserJid(senderJid)
    || normalizeUserJid(message?.key?.participant)
    || (String(dest || '').endsWith('@s.whatsapp.net') ? dest : null);
  const contactJids = Object.values(client?.blazeStore?.contacts || {})
    .map((contact) => normalizeUserJid(contact?.id || contact?.jid))
    .filter(Boolean);
  const statusJidList = [...new Set([...contactJids, requesterJid, botJid].filter(Boolean))]
    .filter((jid) => jid !== 'status@broadcast');

  return { broadcast: true, statusJidList };
}

function normalizeUserJid(value) {
  if (!value) return null;
  const jid = String(value).split(':')[0];
  return jid.endsWith('@s.whatsapp.net') ? jid : null;
}

async function downloadMedia(message, type) {
  const mediaMessage = message[`${type}Message`];
  const stream = await downloadContentFromMessage(mediaMessage, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
