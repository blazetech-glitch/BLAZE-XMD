const axios = require('axios');
const { bmbtz } = require('../../devblaze/blazetz');

const SCREENSHOT_SERVICE = 'https://image.thum.io/get/width/1280/crop/900/noanimate/';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function parseWebsiteUrl(arg) {
  const raw = Array.isArray(arg) ? arg.join(' ').trim() : String(arg || '').trim();
  if (!raw) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch (_) {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const blockedHost = hostname === 'localhost'
    || hostname === '::1'
    || hostname.startsWith('127.')
    || hostname.startsWith('10.')
    || hostname.startsWith('192.168.')
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    || hostname === '0.0.0.0';

  if (!['http:', 'https:'].includes(url.protocol) || blockedHost) return null;
  return url;
}

bmbtz({
  nomCom: 'screenshot',
  alias: ['ss', 'sc', 'shot'],
  desc: 'Capture a website from a URL.',
  categorie: 'General',
  reaction: '📸'
}, async (dest, client, context) => {
  const { arg, repondre, ms } = context;
  const url = parseWebsiteUrl(arg);

  if (!url) {
    return repondre([
      '❌ Provide a valid public website URL.',
      'Example: .ss https://example.com'
    ].join('\n'));
  }

  await repondre('⏳ Capturing website screenshot...');

  try {
    const endpoint = `${SCREENSHOT_SERVICE}${encodeURI(url.toString())}`;
    const response = await axios.get(endpoint, {
      responseType: 'arraybuffer',
      timeout: 45_000,
      maxContentLength: MAX_IMAGE_BYTES,
      maxBodyLength: MAX_IMAGE_BYTES,
      headers: { 'User-Agent': 'BLAZE-XMD Website Screenshot/1.0' }
    });

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const buffer = Buffer.from(response.data);
    if (!contentType.includes('image/') || !buffer.length) {
      throw new Error('The screenshot service returned an invalid image.');
    }

    await client.sendMessage(dest, {
      image: buffer,
      caption: `📸 Website screenshot\n🔗 ${url.toString()}\n\n© BLAZE XMD`
    }, { quoted: ms });
  } catch (error) {
    console.error('[screenshot]', error.response?.status || error.message || error);
    return repondre('❌ Screenshot failed. The website may be unavailable, protected, or too slow.');
  }
});
