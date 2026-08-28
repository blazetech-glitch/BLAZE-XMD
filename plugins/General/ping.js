const { blazetz } = require('../../devblaze/blazetz');

function formatRuntime(totalSeconds) {
  let seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  return [
    days ? `${days}d` : '',
    hours ? `${hours}h` : '',
    minutes ? `${minutes}m` : '',
    `${seconds}s`
  ].filter(Boolean).join(' ');
}

function getLatencyLabel(milliseconds) {
  if (milliseconds < 200) return 'Excellent';
  if (milliseconds < 600) return 'Very good';
  if (milliseconds < 1200) return 'Good';
  return 'Stable';
}

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
    const processRamMb = process.memoryUsage().rss / 1024 / 1024;
    const latency = getLatencyLabel(elapsedMs);

    const statusMessage = [
      '╭─〔 ⚡ *BLAZE XMD* 〕─╮',
      '│ 🟢 *ONLINE* · Ready',
      `│ ⚡ ${elapsedMs.toFixed(2)} ms · ${latency}`,
      `│ ⏱️ ${formatRuntime(process.uptime())} · 🧠 ${processRamMb.toFixed(0)} MB`,
      '╰──────────────────╯',
      '       *ARNOLDT20*'
    ].join('\n');

    return client.sendMessage(dest, { text: statusMessage }, { quoted: ms });
  } catch (error) {
    console.error('[ping]', error);
    return repondre('❌ Ping unavailable.');
  }
});
