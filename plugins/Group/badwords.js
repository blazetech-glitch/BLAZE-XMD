const { blazetz } = require('../../devblaze/blazetz');
const { addBadWord, getBadWords, getState, removeBadWords, setAntiBadWords } = require('../../lib/groupModeration');

function canManage(options) {
  return Boolean(options.verifAdmin || options.superUser);
}

blazetz({
  nomCom: 'antibad',
  alias: ['antibadword'],
  desc: 'Enable or disable automatic bad-word deletion.',
  categorie: 'Group',
  author: 'ARNOLDT20',
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
  author: 'ARNOLDT20',
  reaction: '🚫'
}, async (dest, client, options) => {
  const { repondre, verifGroupe, arg } = options;
  if (!verifGroupe) return repondre('❌ This command is for groups only.');
  if (!canManage(options)) return repondre('❌ Only group admins or the bot owner can manage bad words.');

  const sub = String(arg?.[0] || '').toLowerCase();
  if (sub === 'list' || !sub) {
    const words = await getBadWords(dest);
    return repondre(words.length ? `🚫 *BAD WORDS (${words.length})*\n\n${words.map((word, index) => `${index + 1}. ${word}`).join('\n')}` : '✅ The bad-word list is empty.\n\nAdd one with: .badword add word1, word2');
  }

  if (sub === 'add' || sub === 'remove' || sub === 'rm' || sub === 'delete') {
    const requested = arg.slice(1).join(' ')
      .split(',')
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean);
    if (!requested.length) {
      return repondre(`❌ Provide one or more words separated by commas.\n\nExamples:\n.badword add word1, word2, word3\n.badword remove word1, word2`);
    }
    if (requested.some((word) => word.length > 60 || !/^[\p{L}\p{N}_-]+$/u.test(word))) {
      return repondre('❌ Each entry must contain only letters, numbers, `_`, or `-`, and must be 60 characters or fewer.');
    }

    if (sub === 'add') {
      const results = await Promise.all(requested.map((word) => addBadWord(dest, word)));
      const added = requested.filter((word, index) => results[index]);
      return repondre(`✅ Added ${added.length} word${added.length === 1 ? '' : 's'} to the bad-word list.`);
    }

    const result = await removeBadWords(dest, requested);
    return repondre(result.removed.length
      ? `✅ Removed ${result.removed.length} word${result.removed.length === 1 ? '' : 's'} from the bad-word list.`
      : 'ℹ️ None of those words were in the bad-word list.');
  }

  return repondre('Use: .badword add word1, word2 | .badword remove word1, word2 | .badword list');
});
