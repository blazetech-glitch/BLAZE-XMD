const { blazetz } = require('../../devblaze/blazetz');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { recordStatus } = require('../../lib/statusHistory');
const { getAutoContacts } = require('../../lib/autoContacts');
const { resolveLidForStatus } = require('../../lib/lidResolver');

const STATUS_JID = 'status@broadcast';

blazetz({
  nomCom: 'tostatus',
  alias: ['status', 'statuspost', 'poststatus'],
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
    const statusOptions = await buildStatusOptions(client, dest, ms, auteurMessage);
    if (!statusOptions.statusJidList.length) {
      throw new Error('No synced WhatsApp contacts are available for the status audience. Send or receive a normal chat first, then try again.');
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

      const result = await client.sendMessage(STATUS_JID, payload, statusOptions);
      assertStatusAccepted(result);
      recordStatus({
        type: mediaType,
        voiceNote: mediaType === 'audio' && Boolean(mediaMessage.ptt),
        captionLength: text.length
      }).catch((error) => console.error('[ToStatus] history record failed:', error.message));
    } else {
      const result = await client.sendMessage(STATUS_JID, { text }, {
        ...statusOptions,
        backgroundColor: '#111827',
        font: 2
      });
      assertStatusAccepted(result);
      recordStatus({ type: 'text', captionLength: text.length })
        .catch((error) => console.error('[ToStatus] history record failed:', error.message));
    }

    return repondre(`✅ WhatsApp accepted the ${mediaType ? mediaType[0].toUpperCase() + mediaType.slice(1) : 'text'} status for ${statusOptions.statusJidList.length} contacts.`);
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

async function buildStatusOptions(client, dest, message, senderJid) {
  // Keep the exact account JID as well as its normalized form. The BLAZE
  // Baileys fork uses the supplied JID list to build status encryption
  // recipients, and newer WhatsApp sessions may expose the account as a LID.
  const botJids = [client?.user?.id, client?.user?.lid]
    .map((jid) => normalizeUserJid(jid, client))
    .filter(Boolean);
  const requesterJid = normalizeUserJid(senderJid, client)
    || normalizeUserJid(message?.key?.participant, client)
    || normalizeUserJid(dest, client);
  const contactStores = [
    client?.blazeStore?.contacts,
    client?.store?.contacts,
    client?.contacts
  ].filter((contacts) => contacts && typeof contacts === 'object');
  const liveContactJids = contactStores.flatMap((contacts) => Object.values(contacts))
    .map((contact) => normalizeUserJid(contact?.id || contact?.jid || contact, client))
    .filter(Boolean);
  let persistedContactJids = [];
  try {
    persistedContactJids = (await getAutoContacts())
      .map((contact) => normalizeUserJid(contact?.jid, client))
      .filter(Boolean);
  } catch (error) {
    console.error('[ToStatus] persisted contacts unavailable:', error.message || error);
  }
  // Always include the account itself. Without this, a command sent from the
  // bot's own/private chat can return a message key while WhatsApp creates no
  // visible story because the status encryption audience is empty/invalid.
  const candidateJids = [...new Set([
    ...botJids,
    ...liveContactJids,
    ...persistedContactJids,
    requesterJid
  ].filter(Boolean))]
    .filter((jid) => jid !== 'status@broadcast')
    .filter((jid) => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid'));

  // Baileys may accept an @lid recipient but silently omit it from the
  // published story. Resolve each LID to a phone JID when the session knows
  // the mapping; retain an unresolved LID only as a last-resort fallback.
  const statusJidList = [...new Set(
    await Promise.all(candidateJids.map((jid) => resolveLidForStatus(client, jid)))
  )].filter(Boolean);

  return { broadcast: true, statusJidList };
}

function assertStatusAccepted(result) {
  if (!result?.key?.id) {
    throw new Error('WhatsApp did not return a status message key. The status was not confirmed.');
  }
}

function normalizeUserJid(value, client) {
  if (!value) return null;
  let jid = String(value).trim();
  if (typeof client?.decodeJid === 'function') {
    try {
      const decoded = client.decodeJid(jid);
      if (decoded) jid = decoded;
    } catch (_) {}
  }
  jid = jid.replace(/:\d+(?=@)/, '');
  return jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid') ? jid : null;
}

async function downloadMedia(message, type) {
  const mediaMessage = message[`${type}Message`];
  const stream = await downloadContentFromMessage(mediaMessage, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
