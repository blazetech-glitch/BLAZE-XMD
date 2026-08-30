const { blazetz } = require('../../devblaze/blazetz');
const conf = require('../../settings');

function normalizeJid(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return raw.replace(/:.*(?=@)/, '');
  return `${raw.replace(/\D/g, '')}@s.whatsapp.net`;
}

function senderJid(options, dest) {
  return normalizeJid(options.auteurMessage || options.ms?.key?.participant || options.ms?.key?.remoteJid || dest);
}

blazetz({
  nomCom: 'reportbug',
  alias: ['bugreport', 'bug'],
  desc: 'Send a concise issue report to the bot owner.',
  categorie: 'Bug',
  author: 'ARNOLDT20',
  reaction: '📝'
}, async (dest, client, options) => {
  const { repondre, arg, ms } = options;
  const details = String(arg || '').trim().replace(/\s+/g, ' ').slice(0, 700);
  if (!details) return repondre('📝 Use `.reportbug <short description>` with the command and error details.');

  const ownerJid = normalizeJid(conf.NUMERO_OWNER || '255627417402');
  const sender = senderJid(options, dest);
  if (!ownerJid || !sender) return repondre('❌ Bug report recipient could not be determined.');

  try {
    await client.sendMessage(ownerJid, {
      text: [
        '📝 *BLAZE BUG REPORT*',
        '',
        `From: ${sender}`,
        `Chat: ${String(dest || '').slice(0, 120)}`,
        `Details: ${details}`
      ].join('\n')
    });
    return repondre('✅ Bug report sent. Include the command and exact error next time if available.');
  } catch (error) {
    console.error('[reportbug]', error.message || error);
    return repondre('❌ Bug report could not be delivered right now.');
  }
});
