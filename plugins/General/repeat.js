const { bmbtz } = require('../../devblaze/blazetz');
const { delay } = require('@whiskeysockets/baileys');

const MAX_REPEATS = 10;
const COOLDOWN_MS = 30_000;
const lastRunByChat = new Map();

function parseRepeatArgs(arg) {
  const raw = Array.isArray(arg) ? arg.join(' ').trim() : String(arg || '').trim();
  const match = raw.match(/^(.*?)(?:\s*\|\s*|\s+)(\d+)$/);
  if (!match) return null;
  return { text: match[1].trim(), count: Number(match[2]) };
}

function normalizeJid(jid) {
  if (!jid) return '';
  return String(jid).replace(/:.*(?=@)/, '').trim().toLowerCase();
}

function connectedBotJid(client) {
  const raw = client?.user?.id || '';
  try {
    return normalizeJid(typeof client.decodeJid === 'function' ? client.decodeJid(raw) : raw);
  } catch (_) {
    return normalizeJid(raw);
  }
}

function incomingSenderJid(context, dest) {
  const { auteurMessage, ms } = context;
  const raw = auteurMessage || ms?.key?.participant || ms?.participant || (!dest.endsWith('@g.us') ? dest : '');
  return normalizeJid(raw);
}

bmbtz({
  nomCom: 'repeat',
  alias: ['repeatmsg', 'resend'],
  categorie: 'General',
  reaction: '🔁'
}, async (dest, client, context) => {
  const { arg, repondre, ms, verifGroupe } = context;
  const parsed = parseRepeatArgs(arg);
  const senderJid = incomingSenderJid(context, dest);
  const botJid = connectedBotJid(client);

  if (!senderJid || !botJid || senderJid !== botJid) {
    return repondre('❌ Only the number currently connected to this bot can use this command.');
  }

  if (!parsed || !parsed.text || !Number.isInteger(parsed.count)) {
    return repondre('❌ Usage: .repeat Message to resend | number\nExample: .repeat BLAZE XMD is online | 3');
  }

  if (parsed.count < 1 || parsed.count > MAX_REPEATS) {
    return repondre(`❌ Choose a repeat count from 1 to ${MAX_REPEATS}.`);
  }

  if (!verifGroupe && !senderJid) {
    return repondre('❌ The connected bot identity could not be verified for this chat.');
  }

  const now = Date.now();
  const previous = lastRunByChat.get(dest) || 0;
  if (now - previous < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - previous)) / 1000);
    return repondre(`⏳ Please wait ${remaining}s before using repeat again in this chat.`);
  }
  lastRunByChat.set(dest, now);

  try {
    for (let index = 0; index < parsed.count; index += 1) {
      await client.sendMessage(dest, { text: parsed.text }, { quoted: ms });
      if (index < parsed.count - 1) await delay(1000);
    }
    return repondre(`✅ Repeated the message ${parsed.count} time${parsed.count === 1 ? '' : 's'}.`);
  } catch (error) {
    console.error('[repeat]', error);
    return repondre(`❌ Repeat stopped after an error: ${error.message || 'Unknown error'}`);
  }
});
