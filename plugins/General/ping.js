const { blazetz } = require('../../devblaze/blazetz');
const { formatDuration, panel, latencyLabel } = require('../../lib/proUi');

blazetz({
  nomCom: 'ping',
  desc: 'Check bot speed and system status.',
  categorie: 'General',
  reaction: '⚡',
  author: 'ARNOLDT20'
}, async (dest, client, response) => {
  const { ms, repondre } = response;
  const startedAt = process.hrtime.bigint();
  try {
    const elapsedMs = Math.max(Number(process.hrtime.bigint() - startedAt) / 1e6, 0.01);
    const memoryMb = process.memoryUsage().rss / 1024 / 1024;
    const statusMessage = panel('SYSTEM PULSE', [
      `● ONLINE  ·  ${latencyLabel(elapsedMs)}`,
      `⚡ ${elapsedMs.toFixed(2)} ms`,
      `◷ ${formatDuration(process.uptime())}  ·  ${memoryMb.toFixed(0)} MB`
    ]);
    return client.sendMessage(dest, { text: statusMessage }, { quoted: ms });
  } catch (error) {
    console.error('[ping]', error);
    return repondre('Unable to read system pulse.');
  }
});
