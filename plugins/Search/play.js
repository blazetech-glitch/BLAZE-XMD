const { blazetz } = require('../../devblaze/blazetz');
const axios = require('axios');
const yts = require('yt-search');
const { ytmp4 } = require('ruhend-scraper');

const BOT_NAME = 'BLAZE XMD';
const NEWSLETTER_JID = '120363421014261315@newsletter';
const NEWSLETTER_NAME = 'BLAZE XMD';
const MAX_VIDEO_MB = Number(process.env.BLAZE_MAX_VIDEO_MB || 100);

function getContextInfo(query = '') {
  return {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: NEWSLETTER_JID,
      newsletterName: NEWSLETTER_NAME,
      serverMessageId: -1
    },
    body: query ? `Requested: ${query}` : undefined,
    title: BOT_NAME
  };
}

function cleanFileName(value, fallback) {
  const name = String(value || fallback).replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 120);
  return name || fallback;
}

function firstMediaUrl(value) {
  const preferred = ['downloadUrl', 'downloadurl', 'video_hd', 'video', 'url', 'link'];
  const found = [];
  const visit = (node, key = '', depth = 0) => {
    if (node == null || depth > 5) return;
    if (typeof node === 'string') {
      if (/^https?:\/\/[^\s]+$/i.test(node)) found.push({ key: key.toLowerCase(), url: node });
      return;
    }
    if (Array.isArray(node)) return node.forEach((item) => visit(item, key, depth + 1));
    if (typeof node !== 'object') return;
    Object.entries(node).forEach(([childKey, childValue]) => visit(childValue, childKey, depth + 1));
  };
  visit(value);
  for (const term of preferred) {
    const match = found.find((item) => item.key.includes(term));
    if (match) return match.url;
  }
  return found[0]?.url || null;
}

async function resolveFullVideo(url) {
  const requests = [
    { params: { url, quality: 'highest', format: 'mp4', full: 'true' } },
    { params: { url } }
  ];
  for (const request of requests) {
    try {
      const response = await axios.get('https://apiziaul.vercel.app/api/downloader/ytmp4', { ...request, timeout: 75_000 });
      const result = response.data?.result || response.data?.data || response.data;
      const downloadUrl = firstMediaUrl(result);
      if (downloadUrl) return { downloadUrl, title: result?.title || result?.filename || null };
    } catch (error) {
      console.error('[VIDEO] source attempt failed:', error.response?.status || error.message);
    }
  }

  const scraped = await ytmp4(url);
  const downloadUrl = firstMediaUrl(scraped);
  if (!downloadUrl) throw new Error('No full video URL returned by the YouTube sources.');
  return { downloadUrl, title: scraped?.title || null };
}

async function probeVideo(downloadUrl) {
  try {
    const response = await axios.head(downloadUrl, { timeout: 15_000, maxRedirects: 5, validateStatus: (status) => status >= 200 && status < 400 });
    const bytes = Number(response.headers['content-length'] || 0);
    if (bytes && bytes > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`video-too-large:${Math.round(bytes / 1024 / 1024)}MB`);
    return bytes;
  } catch (error) {
    if (String(error.message).startsWith('video-too-large:')) throw error;
    return 0;
  }
}

function progressCard(title, stage, bar) {
  return [
    '╭━━〔 🎬 *BLAZE XMD* 〕━━╮',
    `│ *${String(title || 'VIDEO').slice(0, 70)}*`,
    `│ ${bar} ${stage}`,
    '╰━━━━━━━━━━━━━━━━━━╯'
  ].join('\n');
}

async function createVideoProgress(client, dest, quoted, title) {
  return client.sendMessage(dest, {
    text: progressCard(title, 'Match found · preparing', '▰▱▱▱')
  }, { quoted });
}

async function advanceVideoProgress(client, dest, progress, title) {
  if (!progress?.key) return;
  try {
    await client.sendMessage(dest, {
      text: progressCard(title, 'Source ready · uploading', '▰▰▰▱'),
      edit: progress.key
    });
  } catch (_) {}
}

function isTransportError(error) {
  return /connection\s+(closed|terminated)|socket|not connected/i.test(String(error?.message || error));
}

async function sendFullVideo(client, dest, url, fileName, caption, quoted, sendAsDocument) {
  const documentPayload = { document: { url }, mimetype: 'video/mp4', fileName, caption };
  if (sendAsDocument) return client.sendMessage(dest, documentPayload, { quoted });

  try {
    return await client.sendMessage(dest, {
      video: { url },
      mimetype: 'video/mp4',
      fileName,
      gifPlayback: false,
      caption
    }, { quoted });
  } catch (error) {
    if (isTransportError(error)) throw error;
    console.warn('[VIDEO] video send failed; retrying as document:', error.message || error);
    return client.sendMessage(dest, documentPayload, { quoted });
  }
}

async function findAudio(query) {
  const search = await yts(query);
  const video = search.videos[0];
  if (!video) throw new Error('No result');
  const response = await axios.get('https://apiziaul.vercel.app/api/downloader/ytplaymp3', {
    params: { query },
    timeout: 75_000
  });
  const result = response.data?.result;
  if (!response.data?.status || !result?.downloadUrl) throw new Error('No audio URL');
  return { video, downloadUrl: result.downloadUrl, title: result.title || video.title };
}

blazetz({
  nomCom: 'play',
  categorie: 'Search',
  reaction: '🎵',
  desc: 'Download one audio result from a public YouTube title search.',
  author: 'ARNOLDT20'
}, async (dest, client, options) => {
  const { ms, arg = [], repondre } = options;
  const query = arg.join(' ').trim();
  if (!query) return repondre('🎵 Send a song name or keyword.\n\nExample: `.play Calm Down`');

  try {
    await client.sendMessage(dest, { react: { text: '⏳', key: ms.key } });
    const { video, downloadUrl, title } = await findAudio(query);
    await client.sendMessage(dest, {
      text: `🎵 *FOUND* — fetching *${video.title}*…`
    }, { quoted: ms });
    await client.sendMessage(dest, {
      audio: { url: downloadUrl },
      mimetype: 'audio/mpeg',
      fileName: `${cleanFileName(title, 'blaze-audio')}.mp3`,
      title: cleanFileName(title, 'BLAZE XMD audio'),
      body: `${video.timestamp || 'Audio'} · ${video.author?.name || 'YouTube'} · BLAZE XMD`,
      image: { url: video.thumbnail, renderSmallThumbnail: true },
      contextInfo: getContextInfo(query)
    }, { quoted: ms });
    await client.sendMessage(dest, { react: { text: '✅', key: ms.key } });
  } catch (error) {
    console.error('[PLAY] Audio download failed:', error.response?.data || error.message || error);
    await client.sendMessage(dest, { react: { text: '❌', key: ms.key } });
    return repondre('❌ Audio download failed. Try another public title.');
  }
});

blazetz({
  nomCom: 'song',
  categorie: 'Search',
  reaction: '🎶',
  desc: 'Download one audio result as a document from a public YouTube title search.',
  author: 'ARNOLDT20'
}, async (dest, client, options) => {
  const { ms, arg = [], repondre } = options;
  const query = arg.join(' ').trim();
  if (!query) return repondre('🎶 Send a song name or keyword.\n\nExample: `.song Calm Down`');

  try {
    await client.sendMessage(dest, { react: { text: '⏳', key: ms.key } });
    const { video, downloadUrl, title } = await findAudio(query);
    await client.sendMessage(dest, {
      text: `🎶 *FOUND* — fetching *${video.title}*…`
    }, { quoted: ms });
    await client.sendMessage(dest, {
      document: { url: downloadUrl },
      mimetype: 'audio/mpeg',
      fileName: `${cleanFileName(title, 'blaze-song')}.mp3`,
      caption: `🎶 *${video.title}*\n${video.timestamp || 'Audio'} · BLAZE XMD`
    }, { quoted: ms });
    await client.sendMessage(dest, { react: { text: '✅', key: ms.key } });
  } catch (error) {
    console.error('[SONG] Document download failed:', error.response?.data || error.message || error);
    await client.sendMessage(dest, { react: { text: '❌', key: ms.key } });
    return repondre('❌ Song download failed. Try another public title.');
  }
});

blazetz({
  nomCom: 'video',
  categorie: 'Search',
  reaction: '🎬',
  desc: 'Download the full available public YouTube video for a title search.',
  author: 'ARNOLDT20'
}, async (dest, client, options) => {
  const { ms, arg = [], repondre } = options;
  const query = arg.join(' ').trim();
  if (!query) return repondre('🎬 Send a song or music-video title.\n\nExample: `.video Calm Down official music video`');

  try {
    await client.sendMessage(dest, { react: { text: '🔎', key: ms.key } });
    const search = await yts(query);
    const video = search.videos.find((item) => item.seconds > 0) || search.videos[0];
    if (!video) return repondre('❌ No YouTube video matched that title.');
    const progress = await createVideoProgress(client, dest, ms, video.title);

    const resolved = await resolveFullVideo(video.url);
    const bytes = await probeVideo(resolved.downloadUrl);
    const title = cleanFileName(resolved.title || video.title, 'blaze-video');
    const fileName = `${title}.mp4`;
    const caption = `🎬 *${video.title}*\n${video.timestamp || 'Video'} · BLAZE XMD`;
    await advanceVideoProgress(client, dest, progress, video.title);
    await sendFullVideo(client, dest, resolved.downloadUrl, fileName, caption, ms, bytes > 50 * 1024 * 1024);
    await client.sendMessage(dest, { react: { text: '✅', key: ms.key } });
  } catch (error) {
    console.error('[VIDEO] Full download failed:', error.response?.data || error.message || error);
    await client.sendMessage(dest, { react: { text: '❌', key: ms.key } });
    return repondre('❌ Full-video download failed. The result may be private, unavailable, region-restricted, or above the configured size limit.');
  }
});
