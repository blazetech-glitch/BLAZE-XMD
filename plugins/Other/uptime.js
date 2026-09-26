const os = require('os');
const { blazetz } = require('../../devblaze/blazetz');
const { formatDuration, panel, latencyLabel } = require('../../lib/proUi');

async function measurePing(client, dest) {
  const startedAt = process.hrtime.bigint();
  try {
    const sent = await client.sendMessage(dest, { text: '◌' });
    const elapsed = Number(process.hrtime.bigint() - startedAt) / 1e6;
    await client.sendMessage(dest, { delete: sent.key }).catch(() => {});
    return elapsed;
  } catch (_) {
    return null;
  }
}

blazetz({
  nomCom: 'uptime',
  desc: 'Check bot runtime and response speed.',
  categorie: 'General',
  reaction: '◷'
}, async (dest, client, options) => {
  const { ms, repondre } = options;
  const latency = await measurePing(client, dest);
  if (latency === null) return repondre('Unable to measure response speed right now.');

  const text = panel('SERVICE STATUS', [
    `● ONLINE  ·  ${latencyLabel(latency)}`,
    `⚡ ${latency.toFixed(2)} ms response`,
    `◷ ${formatDuration(process.uptime())} uptime`,
    `⌘ ${os.platform()}  ·  Node ${process.version.replace(/^v/, '')}`
  ]);
  return client.sendMessage(dest, { text }, { quoted: ms });
});

module.exports = { measurePing };
