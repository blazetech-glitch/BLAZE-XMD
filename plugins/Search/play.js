const { blazetz } = require("../../devblaze/blazetz");
const axios = require('axios');
const yts = require('yt-search');
const { ytmp4 } = require('ruhend-scraper');

const BOT_NAME = 'BLAZE-TECH'; // Change as you want
const NEWSLETTER_JID = '120363421014261315@newsletter';
const NEWSLETTER_NAME = 'Blaze Tech Info';

const buildCaption = (type, video) => {
  const banner = type === "video" ? `${BOT_NAME} VIDEO PLAYER` : `${BOT_NAME} SONG PLAYER`;
  return (
    `*${banner}*\n\n` +
    `╭───────────────◆\n` +
    `│⿻ *Title:* ${video.title}\n` +
    `│⿻ *Duration:* ${video.timestamp}\n` +
    `│⿻ *Views:* ${video.views.toLocaleString()}\n` +
    `│⿻ *Uploaded:* ${video.ago}\n` +
    `│⿻ *Channel:* ${video.author.name}\n` +
    `╰────────────────◆\n\n` +
    `🔗 ${video.url}`
  );
};

// getContextInfo now takes query and botName, and includes body and title
const getContextInfo = (query = '', botName = BOT_NAME) => ({
  forwardingScore: 1,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: NEWSLETTER_NAME,
    serverMessageId: -1
  },
  body: query ? `Requested song: ${query}` : undefined,
  title: botName
});

const buildDownloadingCaption = () => (
  `*${BOT_NAME}*\n\n` +
  `⏬ Downloading your request...`
);

const MAX_VIDEO_MB = Number(process.env.BLAZE_MAX_VIDEO_MB || 100);

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

// PLAY COMMAND (audio)
blazetz(
  { nomCom: "play", categorie: "Search", reaction: "🎵" },
  async (origineMessage, client, commandeOptions) => {
    const { ms, arg } = commandeOptions;
    const query = arg.join(' ');
    if (!query)
      return client.sendMessage(
        origineMessage,
        { text: 'Please provide a song name or keyword.', contextInfo: getContextInfo() },
        { quoted: ms }
      );

    try {
      const search = await yts(query);
      const video = search.videos[0];

      if (!video)
        return client.sendMessage(
          origineMessage,
          { text: 'No results found for your query.', contextInfo: getContextInfo() },
          { quoted: ms }
        );

      const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '');

      const response = await axios.get('https://apiziaul.vercel.app/api/downloader/ytplaymp3', {
        params: { query }
      });
      const data = response.data;

      if (!data.status || !data.result || !data.result.downloadUrl)
        return client.sendMessage(
          origineMessage,
          { text: 'Failed to retrieve the MP3 download link.', contextInfo: getContextInfo() },
          { quoted: ms }
        );

      const downloadUrl = data.result.downloadUrl;
      const fileName = `${data.result.title || safeTitle}.mp3`;

      // Send caption with thumbnail first
      await client.sendMessage(
        origineMessage,
        {
          image: { url: video.thumbnail, renderSmallThumbnail: true },
          caption: buildCaption('audio', video),
          contextInfo: getContextInfo(query)
        },
        { quoted: ms }
      );

      // Send downloading message
      await client.sendMessage(
        origineMessage,
        {
          text: buildDownloadingCaption(),
          contextInfo: getContextInfo()
        },
        { quoted: ms }
      );

      // Send mp3
      await client.sendMessage(
        origineMessage,
        {
          audio: { url: downloadUrl },
          mimetype: 'audio/mpeg',
          fileName,
          title: BOT_NAME,
          body: `Requested song :${query}`,
          image: { url: video.thumbnail, renderSmallThumbnail: true },
          contextInfo: getContextInfo()
        },
        { quoted: ms }
      );

    } catch (err) {
      console.error('[PLAY] Error:', err);
      await client.sendMessage(
        origineMessage,
        { text: 'An error occurred while processing your request.', contextInfo: getContextInfo() },
        { quoted: ms }
      );
    }
  }
);

// SONG COMMAND (audio as document)
blazetz(
  { nomCom: "song", categorie: "Search", reaction: "🎶" },
  async (origineMessage, client, commandeOptions) => {
    const { ms, arg } = commandeOptions;
    const query = arg.join(' ');
    if (!query)
      return client.sendMessage(
        origineMessage,
        { text: 'Please provide a song name or keyword.', contextInfo: getContextInfo() },
        { quoted: ms }
      );

    try {
      const search = await yts(query);
      const video = search.videos[0];

      if (!video)
        return client.sendMessage(
          origineMessage,
          { text: 'No results found for your query.', contextInfo: getContextInfo() },
          { quoted: ms }
        );

      const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '');

      const response = await axios.get('https://apiziaul.vercel.app/api/downloader/ytplaymp3', {
        params: { query }
      });
      const data = response.data;

      if (!data.status || !data.result || !data.result.downloadUrl)
        return client.sendMessage(
          origineMessage,
          { text: 'Failed to retrieve the MP3 download link.', contextInfo: getContextInfo() },
          { quoted: ms }
        );

      const downloadUrl = data.result.downloadUrl;
      const fileName = `${data.result.title || safeTitle}.mp3`;

      // Send caption with thumbnail first
      await client.sendMessage(
        origineMessage,
        {
          image: { url: video.thumbnail },
          caption: buildCaption('song', video),
          contextInfo: getContextInfo()
        },
        { quoted: ms }
      );

      // Send downloading message
      await client.sendMessage(
        origineMessage,
        {
          text: buildDownloadingCaption(),
          contextInfo: getContextInfo()
        },
        { quoted: ms }
      );

      // Send mp3 as document
      await client.sendMessage(
        origineMessage,
        {
          document: { url: downloadUrl },
          mimetype: 'audio/mpeg',
          fileName
        },
        { quoted: ms }
      );

    } catch (err) {
      console.error('[SONG] Error:', err);
      await client.sendMessage(
        origineMessage,
        { text: 'An error occurred while processing your request.', contextInfo: getContextInfo() },
        { quoted: ms }
      );
    }
  }
);

// VIDEO COMMAND (full MP4 from a YouTube title search)
blazetz(
  { nomCom: "video", categorie: "Search", reaction: "🎬", author: 'ARNOLDT20' },
  async (origineMessage, client, commandeOptions) => {
    const { ms, arg, repondre } = commandeOptions;
    const query = arg.join(' ').trim();
    if (!query) return repondre('🎬 Send a song or music-video title.\n\nExample: .video Calm Down official music video');

    try {
      await client.sendMessage(origineMessage, { react: { text: '🔎', key: ms.key } });
      const search = await yts(query);
      const video = search.videos.find((item) => item.seconds > 0) || search.videos[0];
      if (!video) return repondre('❌ No YouTube video matched that title.');

      await client.sendMessage(origineMessage, {
        image: { url: video.thumbnail },
        caption: `🎬 *BLAZE XMD VIDEO*\n\n*${video.title}*\nDuration: ${video.timestamp}\nChannel: ${video.author?.name || 'YouTube'}\n\n⏬ Fetching the full available video...`,
        contextInfo: getContextInfo(query)
      }, { quoted: ms });

      const resolved = await resolveFullVideo(video.url);
      const bytes = await probeVideo(resolved.downloadUrl);
      const safeTitle = String(resolved.title || video.title).replace(/[\\/:*?"<>|]/g, '').slice(0, 120) || 'blaze-video';
      const fileName = `${safeTitle}.mp4`;
      const payload = bytes > 50 * 1024 * 1024
        ? { document: { url: resolved.downloadUrl }, mimetype: 'video/mp4', fileName, caption: '✅ Full available video attached.' }
        : { video: { url: resolved.downloadUrl }, mimetype: 'video/mp4', fileName, gifPlayback: false, caption: '✅ Full available video' };

      await client.sendMessage(origineMessage, payload, { quoted: ms });
      await client.sendMessage(origineMessage, { react: { text: '✅', key: ms.key } });
    } catch (error) {
      console.error('[VIDEO] Full download error:', error.response?.data || error.message || error);
      await client.sendMessage(origineMessage, { react: { text: '❌', key: ms.key } });
      return repondre('❌ I could not fetch the full video. The result may be private, region-restricted, unavailable, or larger than the configured limit.');
    }
  }
);
