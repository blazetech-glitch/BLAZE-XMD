const { blazetz, cm } = require('../../devblaze/blazetz');

const sessions = new Map();
const attachedClients = new WeakSet();
const SESSION_TTL_MS = 5 * 60 * 1000;

function cleanText(value) {
  return String(value || '').trim();
}

function categories() {
  const grouped = new Map();
  for (const command of cm) {
    const category = cleanText(command.categorie || command.category || 'General') || 'General';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(command);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function categoryMenu(prefixe) {
  const list = categories();
  const lines = ['╭━━━〔 ❔ BLAZE XMD HELP 〕━━━╮', '', 'Reply with a category number:', ''];
  list.forEach(([category], index) => lines.push(`${index + 1} ➜ ${category}`));
  lines.push('', `Send a number from 1-${list.length}`, '╰━━━〔 ARNOLDT20 〕━━━╯');
  return { text: lines.join('\n'), list };
}

function commandPage(prefixe, category, commands) {
  const lines = [`╭━━━〔 ❔ ${category.toUpperCase()} HELP 〕━━━╮`, ''];
  for (const command of commands) {
    const name = command.nomCom || command.name || 'unknown';
    const description = cleanText(command.desc || command.description || 'No description available.');
    const aliases = Array.isArray(command.alias) && command.alias.length ? ` · aliases: ${command.alias.join(', ')}` : '';
    lines.push(`• ${prefixe}${name}${aliases}`);
    lines.push(`  ${description}`);
  }
  lines.push('', 'Reply with another category number, `0` for categories, or `back`.', '╰━━━〔 ARNOLDT20 〕━━━╯');
  return lines.join('\n');
}

function messageText(message) {
  return cleanText(
    message?.message?.conversation
      || message?.message?.extendedTextMessage?.text
      || message?.message?.imageMessage?.caption
      || message?.message?.videoMessage?.caption
  );
}

function attachListener(client) {
  if (!client?.ev || attachedClients.has(client)) return;
  attachedClients.add(client);
  client.ev.on('messages.upsert', async (update) => {
    const message = update?.messages?.[0];
    const context = message?.message?.extendedTextMessage?.contextInfo;
    const replyTo = context?.stanzaId;
    if (!replyTo) return;
    const session = sessions.get(replyTo);
    if (!session) return;
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(replyTo);
      return;
    }
    if (message.key?.remoteJid !== session.dest) return;

    sessions.delete(replyTo);
    const answer = messageText(message).toLowerCase();
    const { list } = categoryMenu(session.prefixe);
    const selected = Number.parseInt(answer, 10);
    let outgoing;

    if (answer === '0' || answer === 'back') {
      outgoing = await client.sendMessage(session.dest, { text: categoryMenu(session.prefixe).text }, { quoted: message });
    } else if (Number.isInteger(selected) && selected >= 1 && selected <= list.length) {
      const [category, commands] = list[selected - 1];
      outgoing = await client.sendMessage(session.dest, { text: commandPage(session.prefixe, category, commands) }, { quoted: message });
    } else {
      outgoing = await client.sendMessage(session.dest, { text: `❌ Choose a number from 1-${list.length}, or send 0 for categories.` }, { quoted: message });
    }

    if (outgoing?.key?.id) {
      sessions.set(outgoing.key.id, { dest: session.dest, prefixe: session.prefixe, createdAt: Date.now() });
    }
  });
}

blazetz({
  nomCom: 'help',
  alias: ['h', 'guide', 'commands'],
  desc: 'Interactive help by command category.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '❔'
}, async (dest, client, options) => {
  const { prefixe, repondre } = options;
  attachListener(client);
  const menu = categoryMenu(prefixe || '.');
  const sent = await client.sendMessage(dest, { text: menu.text });
  if (sent?.key?.id) sessions.set(sent.key.id, { dest, prefixe: prefixe || '.', createdAt: Date.now() });
  if (!sent?.key?.id) return repondre(menu.text);
});
