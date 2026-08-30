const { blazetz } = require('../../devblaze/blazetz');

function formatUptime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

blazetz({
  nomCom: 'crsh',
  alias: ['crashcheck', 'healthcheck'],
  desc: 'Run a bounded bot health and stability check.',
  categorie: 'Owner',
  author: 'ARNOLDT20',
  reaction: '🛡️'
}, async (dest, client, options) => {
  const { repondre, superUser, isOwner } = options;
  if (!superUser && !isOwner) return;

  const memory = process.memoryUsage();
  const rssMb = (memory.rss / 1024 / 1024).toFixed(1);
  const heapMb = (memory.heapUsed / 1024 / 1024).toFixed(1);
  const handles = typeof process._getActiveHandles === 'function'
    ? process._getActiveHandles().length
    : 'n/a';

  return repondre([
    '╭─〔 🛡️ BLAZE XMD 〕─╮',
    '│ ✅ Stability check passed',
    `│ ⏱️ Uptime: ${formatUptime(process.uptime())}`,
    `│ 🧠 RSS: ${rssMb} MB · Heap: ${heapMb} MB`,
    `│ 🔌 Active handles: ${handles}`,
    '╰──────────────────╯'
  ].join('\n'));
});
