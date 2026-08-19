const os = require('os');
const { bmbtz } = require('../../devblaze/blazetz');
const settings = require('../../settings');

bmbtz({
  nomCom: 'botinfo',
  alias: ['aboutbot', 'systeminfo'],
  categorie: 'General',
  reaction: 'ℹ️'
}, async (dest, client, context) => {
  const { repondre, ms, superUser } = context;
  if (!superUser) return repondre('❌ This command is available to the bot owner or sudo users only.');

  const uptime = Math.floor(process.uptime());
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const memory = process.memoryUsage();
  const usedMb = (memory.rss / 1024 / 1024).toFixed(1);

  const text = [
    '╭━━━〔 BLAZE XMD INFO 〕━━━╮',
    `┃ Bot: ${settings.BOT_NAME || 'BLAZE XMD'}`,
    `┃ Developer: ${settings.DEV || 'ARNOLDT20'}`,
    `┃ Uptime: ${days}d ${hours}h ${minutes}m`,
    `┃ Memory: ${usedMb} MB`,
    `┃ Node: ${process.version}`,
    `┃ Platform: ${os.platform()}`,
    `┃ Mode: ${settings.MODE === 'on' ? 'Public' : 'Private'}`,
    '╰━━━━━━━━━━━━━━━━━━━━━━╯'
  ].join('\n');

  return repondre(text);
});
