const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { blazetz } = require('../../devblaze/blazetz');

const VISION_SERVICE = process.env.BLAZE_VISION_API || process.env.BLAZE_CHATBOT_API || 'https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/whatsapp-chat';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 1800;

function unwrapMessage(message) {
  let current = message || {};
  for (let index = 0; index < 4; index += 1) {
    if (current.ephemeralMessage?.message) current = current.ephemeralMessage.message;
    else if (current.documentWithCaptionMessage?.message) current = current.documentWithCaptionMessage.message;
    else break;
  }
  return current;
}

function getQuotedContext(ms) {
  return ms?.message?.extendedTextMessage?.contextInfo
    || ms?.message?.imageMessage?.contextInfo
    || ms?.message?.documentMessage?.contextInfo
    || null;
}

function getQuotedMessage(ms, msgRepondu) {
  return msgRepondu?.message || msgRepondu || getQuotedContext(ms)?.quotedMessage || null;
}

function unwrapForAnalysis(message) {
  let current = message || {};
  for (let index = 0; index < 4; index += 1) {
    if (current.viewOnceMessage?.message || current.viewOnceMessageV2?.message || current.viewOnceMessageV2Extension?.message) {
      return { protected: true, message: current.viewOnceMessage?.message || current.viewOnceMessageV2?.message || current.viewOnceMessageV2Extension?.message };
    }
    if (current.ephemeralMessage?.message) current = current.ephemeralMessage.message;
    else break;
  }
  return { protected: false, message: current };
}

async function downloadImage(media) {
  const stream = await downloadContentFromMessage(media, 'image');
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_IMAGE_BYTES) throw new Error('Image is too large for analysis.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function responseText(data) {
  return String(data?.prompt ?? data?.reply ?? data?.response ?? data?.answer ?? data?.result ?? '').trim();
}

blazetz({
  nomCom: 'prompt',
  alias: ['promptgen', 'vision', 'describe'],
  desc: 'Analyze a replied image and create a recreation prompt.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '🧠'
}, async (dest, client, options) => {
  const { ms, msgRepondu, repondre } = options;
  const quoted = getQuotedMessage(ms, msgRepondu);
  const analyzed = unwrapForAnalysis(quoted);
  const image = unwrapMessage(analyzed.message).imageMessage;

  if (analyzed.protected) {
    return repondre('🔒 View Once media cannot be analyzed. Please resend the image normally with permission.');
  }
  if (!image) {
    return repondre('🧠 Reply to a normal image with `.prompt` to create a detailed image prompt.');
  }

  await repondre('🧠 Analyzing the image...');
  try {
    const buffer = await downloadImage(image);
    if (!buffer.length) throw new Error('No image data was available.');
    const mime = String(image.mimetype || 'image/jpeg').split(';')[0];
    const imageData = `data:${mime};base64,${buffer.toString('base64')}`;
    const instruction = 'Analyze this image and write one concise, detailed prompt to recreate its subject, composition, camera angle, lighting, colors, materials, environment, and visual style. Do not claim exact identity or hidden facts. Return only the prompt, with no preamble or markdown.';
    const response = await axios.post(VISION_SERVICE, {
      message: [{ type: 'text', text: instruction }, { type: 'image_url', image_url: { url: imageData, detail: 'auto' } }],
      content: [{ type: 'text', text: instruction }, { type: 'image_url', image_url: { url: imageData, detail: 'auto' } }],
      prompt: instruction,
      image: imageData
    }, { timeout: 60_000, maxContentLength: 10 * 1024 * 1024, headers: { 'Content-Type': 'application/json' } });
    const prompt = responseText(response.data).slice(0, MAX_PROMPT_LENGTH);
    if (!prompt) throw new Error('Vision service returned no prompt.');
    return repondre(`🧠 *IMAGE PROMPT*\n\n${prompt}\n\n© BLAZE XMD`);
  } catch (error) {
    console.error('[prompt analysis]', error.response?.status || error.message || error);
    return repondre('❌ Image analysis failed or timed out. Please try a smaller, normal image again.');
  }
});
