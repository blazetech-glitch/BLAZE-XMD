const axios = require('axios');
const { bmbtz } = require('../../devblaze/blazetz');

const LANGUAGE_ALIASES = {
  english: 'en',
  french: 'fr',
  français: 'fr',
  spanish: 'es',
  español: 'es',
  portuguese: 'pt',
  português: 'pt',
  german: 'de',
  deutsch: 'de',
  italian: 'it',
  swahili: 'sw',
  kiswahili: 'sw',
  arabic: 'ar',
  hindi: 'hi',
  urdu: 'ur',
  bengali: 'bn',
  chinese: 'zh-CN',
  mandarin: 'zh-CN',
  japanese: 'ja',
  korean: 'ko',
  russian: 'ru',
  turkish: 'tr',
  dutch: 'nl',
  greek: 'el',
  hebrew: 'he',
  polish: 'pl',
  ukrainian: 'uk',
  vietnamese: 'vi',
  indonesian: 'id',
  malay: 'ms',
  thai: 'th',
  tamil: 'ta',
  telugu: 'te',
  yoruba: 'yo',
  hausa: 'ha',
  latin: 'la'
};

function parseRequest(arg) {
  const raw = Array.isArray(arg) ? arg.join(' ').trim() : String(arg || '').trim();
  if (!raw) return null;

  const match = raw.match(/^([^\s:,-]+)\s*(?::|,|-)?\s+([\s\S]+)$/);
  if (!match) return null;

  const requestedLanguage = match[1].toLowerCase();
  const targetLanguage = LANGUAGE_ALIASES[requestedLanguage] || requestedLanguage;
  const text = match[2].trim();

  if (!/^[a-z]{2,3}(?:-[a-z]{2,4})?$/i.test(targetLanguage)) return null;
  return { targetLanguage, requestedLanguage, text };
}

function displayLanguage(code, requested) {
  if (requested && requested.length > 2) return requested;
  return code.toUpperCase();
}

bmbtz({
  nomCom: 'translate',
  alias: ['tr', 'trans', 'language'],
  categorie: 'General',
  reaction: '🌐'
}, async (dest, client, context) => {
  const { arg, repondre } = context;
  const request = parseRequest(arg);

  if (!request || !request.text) {
    return repondre([
      '❌ Usage: .translate <language> <message>',
      'Example: .translate sw Hello, how are you?',
      'You can use a language name or ISO code, such as English, French, Swahili, en, fr, or sw.'
    ].join('\n'));
  }

  try {
    const endpoint = 'https://translate.googleapis.com/translate_a/single';
    const response = await axios.get(endpoint, {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: request.targetLanguage,
        dt: 't',
        q: request.text
      },
      timeout: 15_000,
      responseType: 'json'
    });

    const translatedText = Array.isArray(response.data?.[0])
      ? response.data[0].map((part) => part?.[0] || '').join('').trim()
      : '';
    const detectedLanguage = response.data?.[2] || 'auto-detected';

    if (!translatedText) throw new Error('The translation service returned an empty response.');

    return repondre([
      '╭━━━〔 BLAZE TRANSLATOR 〕━━━╮',
      `┃ From: ${String(detectedLanguage).toUpperCase()}`,
      `┃ To: ${displayLanguage(request.targetLanguage, request.requestedLanguage)}`,
      '╰━━━━━━━━━━━━━━━━━━━━━━╯',
      '',
      translatedText
    ].join('\n'));
  } catch (error) {
    const status = error.response?.status;
    console.error('[translate]', status || error.message || error);
    return repondre(status === 400
      ? '❌ That target language code was not accepted. Try a language name or ISO code such as English, French, or sw.'
      : '❌ Translation is temporarily unavailable. Please try again shortly.');
  }
});
