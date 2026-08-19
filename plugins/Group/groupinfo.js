const { bmbtz } = require('../../devblaze/blazetz');

bmbtz({
  nomCom: 'groupinfo',
  alias: ['ginfo', 'groupdetails'],
  categorie: 'Group',
  reaction: '📊'
}, async (dest, client, context) => {
  const { repondre, ms } = context;
  if (!dest.endsWith('@g.us')) return repondre('❌ This command can only be used inside a group.');

  try {
    const metadata = await client.groupMetadata(dest);
    const admins = (metadata.participants || []).filter((member) => member.admin).length;
    const description = metadata.desc ? metadata.desc.replace(/\s+/g, ' ').slice(0, 220) : 'No group description';
    const text = [
      `╭━━━〔 ${metadata.subject || 'GROUP INFO'} 〕━━━╮`,
      `┃ ID: ${dest}`,
      `┃ Members: ${(metadata.participants || []).length}`,
      `┃ Admins: ${admins}`,
      `┃ Created: ${metadata.creation ? new Date(Number(metadata.creation) * 1000).toLocaleDateString('en-GB') : 'Unknown'}`,
      `┃ Description: ${description}`,
      '╰━━━━━━━━━━━━━━━━━━━━━━╯'
    ].join('\n');
    return repondre(text);
  } catch (error) {
    console.error('[groupinfo]', error);
    return repondre(`❌ Unable to read group information: ${error.message || 'Unknown error'}`);
  }
});
