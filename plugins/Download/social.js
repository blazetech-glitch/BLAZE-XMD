const axios = require('axios');
const { blazetz } = require('../../devblaze/blazetz');
const { ttdl, igdl, fbdl, ytmp4 } = require('ruhend-scraper');

const MAX_URL_LENGTH = 2_048;
const MAX_VIDEO_MB = Number(process.env.BLAZE_MAX_VIDEO_MB || 100);
const SUPPORTED_HOSTS = {
  tiktok: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  instagram: ['instagram.com', 'instagr.am'],
  facebook: ['facebook.com', 'fb.watch', 'fb.com'],
  youtube: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  twitter: ['twitter.com', 'x.com', 't.co']
};
const X_API = process.env.BLAZE_XDL_API || '';
const TWITSAVE_URL = 'https://twitsave.com/info';

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
  const source = result?.data || result;
  const duration = source?.duration || source?.durationSec || source?.seconds || null;
  const videoKeys = platform === 'tiktok'
    ? ['video_hd', 'video', 'play', 'download']
    : platform === 'youtube'
      ? ['video_hd', 'video', 'downloadUrl', 'downloadurl', 'download', 'url']
      : ['hd', 'video', 'video_hd', 'mp4', 'downloadUrl', 'download', 'url'];
  const video = firstUrl(source, videoKeys);
  if (video) return { type: 'video', url: video, duration };
  const image = firstUrl(source, ['image', 'photo', 'cover', 'thumbnail', 'thumb']);
  return image ? { type: 'image', url: image } : { type: 'video', url: null, duration };
}

async function probeMedia(url) {
  try {
    const response = await axios.head(url, { timeout: 15_000, maxRedirects: 5, validateStatus: (status) => status >= 200 && status < 400 });
    const length = Number(response.headers['content-length'] || 0);
    if (length && length > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`video-too-large:${Math.round(length / 1024 / 1024)}MB`);
    return { length, contentType: String(response.headers['content-type'] || '').toLowerCase() };
  } catch (error) {
    if (String(error.message).startsWith('video-too-large:')) throw error;
    return { length: 0, contentType: '' };
  }
}

function extractTwitterMedia(html) {
  const candidates = [];
  const add = (value) => {
    const decoded = String(value || '').replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
    if (/^https?:\/\//i.test(decoded)) candidates.push(decoded);
  };
  const directUrlPattern = /https?:\/\/[^\s"'<>]+/gi;
  for (const match of String(html || '').match(directUrlPattern) || []) add(match);
  const videos = candidates.filter((value) => /\.mp4(?:\?|$)/i.test(value) || /video\.twimg\.com/i.test(value));
  if (videos[0]) return { video: videos[0] };
  const images = candidates.filter((value) => /pbs\.twimg\.com/i.test(value) || /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(value));
  if (images[0]) return { image: images[0] };
  return null;
}

async function downloadTwitter(url) {
  const headers = { Accept: 'application/json, text/html', 'User-Agent': 'Mozilla/5.0 BLAZE-XMD/1.0' };
  if (X_API) {
    try {
      const response = await axios.get(X_API, { params: { url }, timeout: 45_000, headers });
      const media = mediaFromResult('twitter', response.data);
      if (media.url) return media.type === 'video' ? { video: media.url } : { image: media.url };
    } catch (error) {
      console.error('[Social downloader:twitter custom endpoint]', error.response?.status || error.message);
    }
  }
  const page = await axios.get(TWITSAVE_URL, { params: { url }, timeout: 45_000, headers: { ...headers, Accept: 'text/html' } });
  const media = extractTwitterMedia(page.data);
  if (!media) throw new Error('Twitter fallback returned no direct media URL.');
  return media;
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
  alias: ['download', 'socialdl', 'sdl', 'twitter', 'tw', 'x', 'twitterdl', 'facebook', 'fbdownload'],
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
    const probe = media.type === 'video' ? await probeMedia(media.url) : { length: 0, contentType: '' };

    const caption = `╭━━━〔 ⬇️ BLAZE DOWNLOAD 〕━━━╮\nPlatform: *${platform.toUpperCase()}*\n${media.duration ? `Duration: *${media.duration}*\n` : ''}╰━━━〔 ARNOLDT20 〕━━━╯`;
    const sendAsDocument = media.type === 'video' && probe.length > 50 * 1024 * 1024;
    const payload = media.type === 'image'
      ? { image: { url: media.url }, caption }
      : sendAsDocument
        ? { document: { url: media.url }, fileName: `blaze-${platform}-full-video.mp4`, mimetype: 'video/mp4', caption }
        : { video: { url: media.url }, caption, mimetype: 'video/mp4', gifPlayback: false };
    await client.sendMessage(dest, payload, { quoted: ms });
    await client.sendMessage(dest, { react: { text: '✅', key: ms.key } });
  } catch (error) {
    console.error(`[Social downloader:${platform}]`, error.response?.data || error.message || error);
    await client.sendMessage(dest, { react: { text: '❌', key: ms.key } });
    return repondre(`❌ I could not download that ${platform} link. It may be private, expired, region-restricted, unsupported by the source, or the downloader service may be temporarily unavailable.`);
  }
});
