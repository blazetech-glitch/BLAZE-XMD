const BRAND = 'BLAZE XMD';
const ACCENT = '◈';

function formatDuration(totalSeconds) {
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

function panel(title, rows = [], footer = 'BLAZE-TECH') {
  const safeTitle = String(title || '').trim();
  const lines = [
    `╭─${ACCENT} *${BRAND}*`,
    `│ *${safeTitle}*`,
    '├──────────────'
  ];
  for (const row of rows) {
    if (row === null || row === undefined || row === '') continue;
    const value = typeof row === 'string' ? row : `${row.label}: ${row.value}`;
    lines.push(`│ ${value}`);
  }
  lines.push('╰──────────────');
  if (footer) lines.push(`   _${footer}_`);
  return lines.join('\n');
}

function latencyLabel(milliseconds) {
  if (milliseconds < 200) return 'Excellent';
  if (milliseconds < 600) return 'Very good';
  if (milliseconds < 1200) return 'Good';
  return 'Stable';
}

module.exports = { BRAND, formatDuration, panel, latencyLabel };
