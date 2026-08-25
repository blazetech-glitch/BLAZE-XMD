const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { blazetz } = require('../../devblaze/blazetz');
const { requestVision } = require('../../lib/vision');
const { findRepliedImage } = require('../../lib/repliedImage');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 1800;

async function imageBuffer(media) {
  const stream = await downloadContentFromMessage(media, 'image');
  const chunks = [];
  let total = 0;
  for await (const chunk of stream) {
    total += chunk.length;
    if (total > MAX_IMAGE_BYTES) throw new Error('image-too-large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

blazetz({
  nomCom: 'prompt',
  alias: ['promptgen', 'vision', 'describe'],
  desc: 'Create a recreation prompt from a replied image.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '🧠'
}, async (dest, client, options) => {
  const { repondre } = options;
  const target = findRepliedImage(options);
  const image = target.image;

  if (target.protected) return repondre('🔒 View Once media cannot be analyzed. Resend the image normally with permission.');
  if (!image) return repondre('🧠 Reply to a normal image with `.prompt`.');

  await repondre('🧠 Creating the image prompt...');
  try {
    const buffer = await imageBuffer(image);
    if (!buffer.length) throw new Error('empty-image');
    const mime = String(image.mimetype || 'image/jpeg').split(';')[0];
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    const prompt = await requestVision(dataUrl, 'Write one concise but detailed prompt to recreate this image. Include visible subject, composition, camera angle, lighting, colors, materials, setting, and visual style. Do not identify private people or invent hidden facts. Return only the prompt.');
    if (!prompt) throw new Error('empty-vision-response');
    return repondre(`🧠 *IMAGE PROMPT*\n\n${prompt.slice(0, MAX_PROMPT_LENGTH)}\n\n© BLAZE XMD`);
  } catch (error) {
    console.error('[prompt analysis]', error.response?.status || error.message || error);
    return repondre(process.env.BLAZE_VISION_API
      ? '❌ Prompt analysis failed. Check the vision endpoint, API key, or send a smaller normal image.'
      : '❌ Prompt analysis needs a vision API. Set `BLAZE_VISION_API` to an OpenAI-compatible vision endpoint, then restart the bot.');
  }
});
