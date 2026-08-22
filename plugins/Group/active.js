const { blazetz } = require('../../devblaze/blazetz');
const { getActiveMembers } = require('../../lib/groupModeration');

blazetz({
  nomCom: 'active',
  alias: ['actives', 'activity'],
  desc: 'List active group members and their message counts.',
  categorie: 'Group',
  reaction: '📊'
}, async (dest, client, options) => {
  const { repondre, verifGroupe, infosGroupe } = options;
  if (!verifGroupe) return repondre('❌ This command is for groups only.');

  const members = new Map((infosGroupe?.participants || []).map((member) => {
    const jid = typeof member === 'string' ? member : member?.jid || member?.id || member?.phoneNumber || member?.lid;
    return [jid, member];
  }).filter(([jid]) => jid));
  const activity = (await getActiveMembers(dest)).filter((entry) => members.has(entry.jid));
  if (!activity.length) return repondre('📊 No group-message activity has been recorded yet.');

  const rows = activity.slice(0, 50).map((entry, index) => `${index + 1}. @${entry.jid.split('@')[0]} — ${entry.messages} message${entry.messages === 1 ? '' : 's'}`);
  return client.sendMessage(dest, {
    text: `📊 *ACTIVE GROUP MEMBERS*\n\n${rows.join('\n')}`,
    mentions: activity.slice(0, 50).map((entry) => entry.jid)
  });
});
