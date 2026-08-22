const { blazetz } = require('../../devblaze/blazetz');
const { addBadWord, getBadWords, getState, setAntiBadWords } = require('../../lib/groupModeration');

function canManage(options) {
  return Boolean(options.verifAdmin || options.superUser);
}

blazetz({
  nomCom: 'antibad',
  alias: ['antibadword'],
  desc: 'Enable or disable automatic bad-word deletion.',
  categorie: 'Group',
  reaction: '🛡️'
}, async (dest, client, options) => {
  const { repondre, verifGroupe, arg } = options;
  if (!verifGroupe) return repondre('❌ This command is for groups only.');
  if (!canManage(options)) return repondre('❌ Only group admins or the bot owner can change this setting.');
  const sub = String(arg?.[0] || '').toLowerCase();
  if (!['on', 'off'].includes(sub)) {
    const state = await getState(dest);
    return repondre(`🛡️ *ANTIBADWORDS*\n\nStatus: ${state.antiBadWords.toUpperCase()}\nWords: ${state.badWords.length}\n\nUse: .antibad on | .antibad off`);
  }
  await setAntiBadWords(dest, sub === 'on');
  return repondre(`✅ Anti-bad-word moderation is now *${sub.toUpperCase()}*.`);
});

blazetz({
  nomCom: 'badword',
  alias: ['badwords'],
  desc: 'Add or list words blocked by anti-bad-word moderation.',
  categorie: 'Group',
  reaction: '🚫'
}, async (dest, client, options) => {
  const { repondre, verifGroupe, arg } = options;
  if (!verifGroupe) return repondre('❌ This command is for groups only.');
  if (!canManage(options)) return repondre('❌ Only group admins or the bot owner can manage bad words.');

  const sub = String(arg?.[0] || '').toLowerCase();
  if (sub === 'list' || !sub) {
    const words = await getBadWords(dest);
    return repondre(words.length ? `🚫 *BAD WORDS (${words.length})*\n\n${words.map((word, index) => `${index + 1}. ${word}`).join('\n')}` : '✅ The bad-word list is empty.\n\nAdd one with: .badword add word');
  }

  if (sub === 'add') {
    const word = arg.slice(1).join(' ').trim();
    if (!word || /\s/.test(word)) return repondre('❌ Add one word at a time.\n\nExample: .badword add example');
    if (!/^[\p{L}\p{N}_-]+$/u.test(word)) return repondre('❌ Use letters, numbers, `_`, or `-` only.');
    const added = await addBadWord(dest, word);
    return repondre(added ? `✅ Added *${word.toLowerCase()}* to the bad-word list.` : '❌ That word could not be added.');
  }

  return repondre('Use: .badword add <word> | .badword list');
});
