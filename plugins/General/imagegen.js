const axios = require('axios');
const { blazetz } = require('../../devblaze/blazetz');

const IMAGE_SERVICE = 'https://image.pollinations.ai/prompt/';
const MAX_PROMPT_LENGTH = 800;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

blazetz({
  nomCom: 'imagine',
  alias: ['img', 'gen', 'draw'],
  desc: 'Generate an image from a text prompt.',
  categorie: 'General',
  reaction: '🎨'
}, async (dest, client, context) => {
  const { arg, repondre, ms } = context;
  const prompt = Array.isArray(arg) ? arg.join(' ').trim() : String(arg || '').trim();

  if (!prompt) {
    return repondre([
      '❌ Add a prompt for the image.',
      'Example: .img a cinematic blue flame logo for BLAZE XMD'
    ].join('\n'));
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return repondre(`❌ Keep the prompt under ${MAX_PROMPT_LENGTH} characters.`);
  }

  await repondre('🎨 Generating your image...');

  try {
    const endpoint = `${IMAGE_SERVICE}${encodeURIComponent(prompt)}`;
    const response = await axios.get(endpoint, {
      params: {
        width: 1024,
        height: 1024,
        nologo: true,
        safe: true
      },
      responseType: 'arraybuffer',
      timeout: 60_000,
      maxContentLength: MAX_IMAGE_BYTES,
      maxBodyLength: MAX_IMAGE_BYTES,
      headers: { 'User-Agent': 'BLAZE-XMD Image Generator/1.0' }
    });

    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const buffer = Buffer.from(response.data);
    if (!contentType.includes('image/') || !buffer.length) {
      throw new Error('The image service returned an invalid image.');
    }

    await client.sendMessage(dest, {
      image: buffer,
      caption: `🎨 Generated image\n📝 ${prompt}\n\n© BLAZE XMD`
    }, { quoted: ms });
  } catch (error) {
    console.error('[imagegen]', error.response?.status || error.message || error);
    return repondre('❌ Image generation failed or timed out. Please try a shorter prompt again.');
  }
});
