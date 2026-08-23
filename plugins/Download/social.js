const axios = require('axios');
const { blazetz } = require('../../devblaze/blazetz');
const { ttdl, igdl, fbdl, ytmp4 } = require('ruhend-scraper');

const MAX_URL_LENGTH = 2_048;
const SUPPORTED_HOSTS = {
  tiktok: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  instagram: ['instagram.com', 'instagr.am'],
  facebook: ['facebook.com', 'fb.watch', 'fb.com'],
  youtube: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  twitter: ['twitter.com', 'x.com', 't.co']
};
const X_API = process.env.BLAZE_XDL_API || 'https://api.fabdl.com/twitter/v1/video';

function hostMatches(hostname, domains) {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function detectPlatform(value) {
  let parsed;
  try { parsed = new URL(value); } catch { return null; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  return Object.entries(SUPPORTED_HOSTS).find(([, domains]) => hostMatches(hostname, domains))?.[0] || null;
}

function firstUrl(value, preferred = []) {
  const found = [];
  function visit(node, key = '', depth = 0) {
    if (depth > 5 || node == null) return;
    if (typeof node === 'string') {
      if (/^https?:\/\/[^\s]+$/i.test(node)) found.push({ key: key.toLowerCase(), url: node });
      return;
    }
    if (Array.isArray(node)) return node.forEach((item) => visit(item, key, depth + 1));
    if (typeof node !== 'object') return;
    for (const [childKey, childValue] of Object.entries(node)) visit(childValue, childKey, depth + 1);
  }
  visit(value);
  for (const term of preferred) {
    const match = found.find((item) => item.key.includes(term));
    if (match) return match.url;
  }
  return found[0]?.url || null;
}

function mediaFromResult(platform, result) {
  if (platform === 'tiktok') return { type: 'video', url: firstUrl(result, ['video_hd', 'video', 'download']) };
  if (platform === 'youtube') return { type: 'video', url: firstUrl(result, ['downloadurl', 'download', 'video', 'url']) };
  if (platform === 'instagram' || platform === 'facebook' || platform === 'twitter') {
    const video = firstUrl(result, ['hd', 'video', 'mp4', 'download']);
    if (video) return { type: 'video', url: video };
    return { type: 'image', url: firstUrl(result, ['image', 'photo', 'thumbnail', 'url']) };
  }
  return { type: 'video', url: firstUrl(result, ['download', 'url']) };
}

async function downloadTwitter(url) {
  const response = await axios.get(X_API, {
    params: { url },
    timeout: 45_000,
    headers: { Accept: 'application/json', 'User-Agent': 'BLAZE-XMD/1.0' }
  });
  return response.data;
}

async function fetchMedia(platform, url) {
  if (platform === 'tiktok') return ttdl(url);
  if (platform === 'instagram') return igdl(url);
  if (platform === 'facebook') return fbdl(url);
  if (platform === 'youtube') return ytmp4(url);
  if (platform === 'twitter') return downloadTwitter(url);
  throw new Error('Unsupported platform');
}

blazetz({
  nomCom: 'dl',
  alias: ['download', 'socialdl', 'sdl'],
  categorie: 'Download',
  reaction: '⬇️',
  desc: 'Download public videos from supported social-media links',
  author: 'ARNOLDT20'
}, async (dest, client, options) => {
  const { arg = [], repondre, ms } = options;
  const rawUrl = String(arg[0] || '').trim();
  if (!rawUrl) return repondre('⬇️ Send a public TikTok, Instagram, Facebook, YouTube, X, or Twitter link.\n\nExample: .dl https://www.tiktok.com/...');
  if (rawUrl.length > MAX_URL_LENGTH) return repondre('❌ That link is too long. Please send one public link at a time.');

  const platform = detectPlatform(rawUrl);
  if (!platform) return repondre('❌ Unsupported or invalid link. Supported hosts: TikTok, Instagram, Facebook, YouTube, X, and Twitter.');

  try {
    await client.sendMessage(dest, { react: { text: '⏳', key: ms.key } });
    const result = await fetchMedia(platform, rawUrl);
    const media = mediaFromResult(platform, result);
    if (!media.url) throw new Error('No downloadable media was returned.');

    const caption = `╭━━━〔 ⬇️ BLAZE DOWNLOAD 〕━━━╮\nPlatform: *${platform.toUpperCase()}*\n╰━━━〔 ARNOLDT20 〕━━━╯`;
    const payload = media.type === 'image'
      ? { image: { url: media.url }, caption }
      : { video: { url: media.url }, caption, mimetype: 'video/mp4' };
    await client.sendMessage(dest, payload, { quoted: ms });
    await client.sendMessage(dest, { react: { text: '✅', key: ms.key } });
  } catch (error) {
    console.error(`[Social downloader:${platform}]`, error.response?.data || error.message || error);
    await client.sendMessage(dest, { react: { text: '❌', key: ms.key } });
    return repondre(`❌ I could not download that ${platform} link. It may be private, expired, region-restricted, unsupported by the source, or the downloader service may be temporarily unavailable.`);
  }
});
