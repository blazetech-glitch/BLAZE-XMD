const { blazetz } = require('../../devblaze/blazetz');
const axios = require('axios');

const REPOSITORY = 'blazetech-glitch/BLAZE-XMD';
const ARCHIVE_URL = `https://github.com/${REPOSITORY}/archive/refs/heads/main.zip`;
const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;

blazetz({
  nomCom: 'repozip',
  alias: ['sourcezip', 'getzip'],
  desc: 'Download the latest BLAZE-XMD main repository ZIP.',
  categorie: 'General',
  reaction: '📦'
}, async (dest, client, { ms, repondre, superUser }) => {
  if (!superUser) {
    return repondre('❌ This command is restricted to the bot owner.');
  }

  try {
    await repondre('⏳ Preparing the latest BLAZE-XMD repository ZIP...');

    const response = await axios.get(ARCHIVE_URL, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: MAX_ARCHIVE_BYTES,
      maxBodyLength: MAX_ARCHIVE_BYTES,
      headers: {
        Accept: 'application/zip',
        'User-Agent': 'BLAZE-XMD-Repository-Archive'
      }
    });

    const archive = Buffer.from(response.data);
    if (!archive.length || archive.length > MAX_ARCHIVE_BYTES) {
      return repondre('❌ The repository archive is empty or exceeds the 50 MB transfer limit.');
    }

    if (archive[0] !== 0x50 || archive[1] !== 0x4b) {
      return repondre('❌ GitHub did not return a valid ZIP archive.');
    }

    await client.sendMessage(dest, {
      document: archive,
      mimetype: 'application/zip',
      fileName: 'BLAZE-XMD-main.zip',
      caption: '📦 Latest BLAZE-XMD main repository archive.'
    }, { quoted: ms });
  } catch (error) {
    console.error('[Repo ZIP] Download failed:', error?.message || error);
    return repondre('❌ The latest repository ZIP could not be downloaded. Please try again later.');
  }
});
