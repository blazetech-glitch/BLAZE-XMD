const axios = require('axios');

function visionEndpoint() {
  if (process.env.BLAZE_VISION_API) return process.env.BLAZE_VISION_API;
  if (process.env.OPENAI_API_BASE) return `${process.env.OPENAI_API_BASE.replace(/\/$/, '')}/chat/completions`;
  if (process.env.BUILT_IN_FORGE_API_URL) return `${process.env.BUILT_IN_FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`;
  return '';
}

function textFromResponse(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) return content.map((part) => part?.text || '').join(' ').trim();
  return String(data?.description ?? data?.prompt ?? data?.reply ?? data?.response ?? data?.answer ?? data?.result ?? content ?? '').trim();
}

async function requestVision(imageData, instruction) {
  const endpoint = visionEndpoint();
  if (!endpoint) throw new Error('vision-not-configured');

  const headers = { 'Content-Type': 'application/json' };
  const token = process.env.BLAZE_VISION_API_KEY || process.env.OPENAI_API_KEY || process.env.BUILT_IN_FORGE_API_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await axios.post(endpoint, {
    model: process.env.BLAZE_VISION_MODEL || 'gemini-3-flash-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: instruction },
        { type: 'image_url', image_url: { url: imageData, detail: 'auto' } }
      ]
    }],
    temperature: 0.2,
    max_tokens: 900
  }, {
    timeout: 60_000,
    maxContentLength: 12 * 1024 * 1024,
    maxBodyLength: 12 * 1024 * 1024,
    headers
  });

  return textFromResponse(response.data);
}

module.exports = { requestVision, textFromResponse, visionEndpoint };
