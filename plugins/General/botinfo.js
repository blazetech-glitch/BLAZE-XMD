const os = require('os');
const { blazetz } = require('../../devblaze/blazetz');
const settings = require('../../settings');
const { formatDuration, panel } = require('../../lib/proUi');

blazetz({
  nomCom: 'botinfo',
  alias: ['aboutbot', 'systeminfo'],
  categorie: 'General',
  reaction: 'ℹ️'
}, async (dest, client, context) => {
  const { repondre, ms, superUser } = context;
  if (!superUser) return repondre('This command is available to the bot owner or sudo users only.');

  const memoryMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  const text = panel('SYSTEM PROFILE', [
    `◉ ${settings.BOT_NAME || 'BLAZE XMD'}  ·  ${settings.MODE === 'on' ? 'PUBLIC' : 'PRIVATE'}`,
    `⌁ ${formatDuration(process.uptime())} uptime  ·  ${memoryMb} MB`,
    `⌘ Node ${process.version.replace(/^v/, '')}  ·  ${os.platform()}`,
    `◌ Owner  ·  ${settings.OWNER_NAME || 'ARNOLDT20'}`
  ]);
  return client.sendMessage(dest, { text }, { quoted: ms });
});
