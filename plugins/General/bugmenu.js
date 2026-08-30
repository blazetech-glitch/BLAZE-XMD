const { blazetz } = require('../../devblaze/blazetz');

blazetz({
  nomCom: 'bugmenu',
  alias: ['bugs', 'bughelp'],
  desc: 'Show safe diagnostics and bug-reporting commands.',
  categorie: 'Bug',
  author: 'ARNOLDT20',
  reaction: '🧰'
}, async (dest, client, options) => {
  const { repondre } = options;
  return repondre([
    '╭─〔 🧰 BLAZE BUG MENU 〕─╮',
    '│ .ping · latency and online check',
    '│ .crsh · owner health and memory check',
    '│ .reportbug <details> · send a bug report',
    '│ .help · browse all available commands',
    '╰──────────────────────╯',
    'Send the exact error and command when reporting.'
  ].join('\n'));
});
