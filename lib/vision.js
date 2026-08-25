const axios = require('axios');

const VISION_SERVICE = process.env.BLAZE_VISION_API || '';
const CHAT_SERVICE = process.env.BLAZE_CHATBOT_API || 'https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/whatsapp-chat';
const VISION_MODEL = process.env.BLAZE_VISION_MODEL || 'gemini-3-flash-preview';

function textFromResponse(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content.map((part) => part?.text || '').join(' ').trim();
  }
  return String(data?.prompt ?? data?.description ?? data?.reply ?? data?.response ?? data?.answer ?? data?.result ?? content ?? '').trim();
}

async function requestVision(imageData, instruction) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.BLAZE_VISION_API_KEY) headers.Authorization = `Bearer ${process.env.BLAZE_VISION_API_KEY}`;

  if (VISION_SERVICE) {
    const response = await axios.post(VISION_SERVICE, {
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: instruction },
          { type: 'image_url', image_url: { url: imageData, detail: 'auto' } }
        ]
      }],
      temperature: 0.2,
      max_tokens: 900
    }, { timeout: 60_000, maxContentLength: 12 * 1024 * 1024, headers });
    return textFromResponse(response.data);
  }

  const response = await axios.post(CHAT_SERVICE, {
    message: instruction,
    prompt: instruction,
    image: imageData,
    image_url: imageData
  }, { timeout: 60_000, maxContentLength: 12 * 1024 * 1024, headers });
  return textFromResponse(response.data);
}

module.exports = { requestVision, textFromResponse };
