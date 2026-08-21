const { blazetz } = require('../../devblaze/blazetz');
const os = require('os');
const { ButtonV2 } = require('../../lib/buttonBuilder');
const conf = require('../../settings');

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

function getGreeting() {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    hour: 'numeric',
    hour12: false
  }).format(new Date()));

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  if (hour >= 18 && hour < 22) return 'Good evening';
  return 'Good night';
}

function getLatencyLabel(milliseconds) {
  if (milliseconds < 0.2) return 'Excellent';
  if (milliseconds < 0.6) return 'Very good';
  if (milliseconds < 1.2) return 'Good';
  return 'Stable';
}

blazetz({
  nomCom: 'ping',
  desc: 'Check bot speed and system status.',
  categorie: 'General',
  reaction: '⚡'
}, async (dest, client, response) => {
  const { ms, repondre } = response;
  const startedAt = process.hrtime.bigint();

  try {
    const elapsedMs = Math.max(Number(process.hrtime.bigint() - startedAt) / 1e6, 0.01);
    const totalRamMb = os.totalmem() / 1024 / 1024;
    const freeRamMb = os.freemem() / 1024 / 1024;
    const usedRamMb = totalRamMb - freeRamMb;
    const memoryPercent = totalRamMb ? ((usedRamMb / totalRamMb) * 100).toFixed(1) : '0.0';
    const processRamMb = process.memoryUsage().rss / 1024 / 1024;
    const prefix = conf.PREFIXE || '.';
    const serverTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Nairobi',
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date());
    const latencyLabel = getLatencyLabel(elapsedMs);

    const statusMessage = [
      '╭━━━〔 ⚡ BLAZE XMD PING 〕━━━╮',
      `┃ ${getGreeting()}, BLAZE family`,
      '┃',
      `┃ 🚀 Speed    : ${elapsedMs.toFixed(2)} ms`,
      `┃ 📶 Quality  : ${latencyLabel}`,
      `┃ 🟢 Status   : Online`,
      '┃',
      `┃ ⏱️ Uptime   : ${formatRuntime(process.uptime())}`,
      `┃ 🧠 Process  : ${processRamMb.toFixed(1)} MB`,
      `┃ 💾 Memory   : ${usedRamMb.toFixed(0)}/${totalRamMb.toFixed(0)} MB (${memoryPercent}%)`,
      `┃ ⚙️ Runtime  : Node ${process.version.replace(/^v/, '')}`,
      `┃ 🌍 Server   : ${serverTime}`,
      `┃ 🔧 Prefix   : ${prefix}`,
      '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
      '© ARNOLDT20 • BLAZE XMD'
    ].join('\n');

    await client.sendMessage(dest, { text: statusMessage }, { quoted: ms });

    try {
      const buttons = new ButtonV2(client);
      buttons
        .setBody('╭━━━〔 QUICK ACCESS 〕━━━╮\n┃ Choose an action below\n╰━━━━━━━━━━━━━━━━━━━━━━╯')
        .setFooter('BLAZE XMD • ARNOLDT20')
        .addButton('📜 Menu', `${prefix}menu`)
        .addButton('👑 Owner', `${prefix}owner`);
      await buttons.send(dest, { mentions: response.auteurMessage ? [response.auteurMessage] : [] });
    } catch (buttonError) {
      console.log('[ping] Quick-access buttons unavailable:', buttonError?.message || buttonError);
    }
  } catch (error) {
    console.error('[ping]', error);
    return repondre('❌ Ping could not be completed. Please try again.');
  }
});
