const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { blazetz } = require('../../devblaze/blazetz');
const { requestVision } = require('../../lib/vision');
const { findRepliedImage } = require('../../lib/repliedImage');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
  nomCom: 'analyze',
  alias: ['analyse', 'what', 'whatsin', 'imginfo'],
  desc: 'Describe what is visible in a replied image.',
  categorie: 'General',
  author: 'ARNOLDT20',
  reaction: '🔍'
}, async (dest, client, options) => {
  const { repondre } = options;
  const target = findRepliedImage(options);
  const image = target.image;

  if (target.protected) return repondre('🔒 View Once media cannot be analyzed. Resend the image normally with permission.');
  if (!image) return repondre('🔍 Reply to a normal image with `.analyze`.');

  await repondre('🔍 Looking at the image...');
  try {
    const buffer = await imageBuffer(image);
    if (!buffer.length) throw new Error('empty-image');
    const mime = String(image.mimetype || 'image/jpeg').split(';')[0];
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    const description = await requestVision(dataUrl, 'Describe only what is visibly present in this image. Mention the main subjects, setting, colors, visible text if readable, actions, and notable objects. Be accurate, concise, and do not guess private identity, location, or facts that cannot be seen.');
    if (!description) throw new Error('empty-vision-response');
    return repondre(`🔍 *IMAGE ANALYSIS*\n\n${description.slice(0, 2200)}\n\n© BLAZE XMD`);
  } catch (error) {
    console.error('[image analysis]', error.response?.status || error.message || error);
    return repondre(process.env.BLAZE_VISION_API
      ? '❌ Image analysis failed. Check the vision endpoint, API key, or send a smaller normal image.'
      : '❌ Image analysis needs a vision API. Set `BLAZE_VISION_API` to an OpenAI-compatible vision endpoint, then restart the bot.');
  }
});
