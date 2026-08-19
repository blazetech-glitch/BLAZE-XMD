const axios = require('axios');
const { bmbtz } = require('../../devblaze/blazetz');

const AI_API = process.env.BLAZE_CHATBOT_API || 'https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/whatsapp-chat';
const MAX_QUERY_LENGTH = 1800;

const MODES = {
  code: 'You are an expert programmer. Provide correct, clean code with a concise explanation.',
  creative: 'You are a creative writer. Make the response vivid, original, and well structured.',
  explain: 'You are a patient teacher. Explain the topic simply, with examples when helpful.'
};

function extractQuotedText(message) {
  if (!message) return '';
  return String(
    message.conversation
      || message.extendedTextMessage?.text
      || message.imageMessage?.caption
      || message.videoMessage?.caption
      || ''
  ).trim();
}

function isLikelyAiResponse(text) {
  return /^╭━━━〔\s*🤖\s*BLAZE AI/i.test(text)
    || /^🤖\s*\*?BLAZE GPT/i.test(text)
    || /╰━━━〔\s*ARNOLDT20\s*〕━━━╯/i.test(text);
}

bmbtz(
  {
    nomCom: 'gpt',
    categorie: 'Search',
    reaction: '🤖',
    alias: ['ask', 'aiask', 'askgpt']
  },
  async (dest, client, context) => {
    const { arg = [], repondre, ms, msgRepondu } = context;
    const first = String(arg[0] || '').toLowerCase();
    const quotedText = extractQuotedText(msgRepondu);
    const replyingToAi = isLikelyAiResponse(quotedText);

    if (!arg.length && !replyingToAi || ['help', '?'].includes(first)) {
      return repondre([
        '🤖 *BLAZE XMD AI ASSISTANT*',
        '',
        '`.gpt your question` — ask anything',
        '`.gpt code write a JavaScript function` — coding mode',
        '`.gpt explain async and await` — explanation mode',
        '`.gpt creative write a short story` — creative mode',
        '',
        'Reply to an AI answer with `.gpt your follow-up` to continue that conversation.',
        'Short aliases: `.ask`, `.aiask`, `.askgpt`'
      ].join('\n'));
    }

    let mode = 'general';
    let query = arg.join(' ').trim();
    if (MODES[first]) {
      mode = first;
      query = arg.slice(1).join(' ').trim();
    }

    if (!query && replyingToAi) query = 'Continue the previous answer and provide the next useful detail.';
    if (!query) return repondre(`❌ Add a question after the ${mode} mode.`);
    if (query.length > MAX_QUERY_LENGTH) return repondre(`❌ Keep your question under ${MAX_QUERY_LENGTH} characters.`);

    await client.sendMessage(dest, { react: { text: '⏳', key: ms.key } }).catch(() => {});

    try {
      let instruction = MODES[mode]
        ? `${MODES[mode]}\n\nUser request:\n${query}`
        : query;

      if (replyingToAi) {
        const trimmedQuoted = quotedText.slice(0, 3800);
        instruction = [
          'Continue the conversation using the previous AI answer below as context.',
          'Do not repeat the entire previous answer unless the user asks for it.',
          '',
          `Previous AI answer:\n${trimmedQuoted}`,
          '',
          `Follow-up request:\n${instruction}`
        ].join('\n');
      }

      const response = await axios.post(AI_API, {
        message: instruction,
        conversation_id: `gpt:${dest}`
      }, {
        timeout: 60_000,
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data || {};
      let answer = data.reply ?? data.response ?? data.answer ?? data.result;
      if (answer === undefined || answer === null) throw new Error('AI service returned no answer.');
      answer = String(answer).trim().slice(0, 3800);
      if (!answer) throw new Error('AI service returned an empty answer.');

      const modeLabel = mode === 'general' ? '' : `\n🧭 *Mode:* ${mode.toUpperCase()}\n`;
      const continuationLabel = replyingToAi ? '\n🔁 *Conversation continued*\n' : '';
      const output = [
        '╭━━━〔 🤖 BLAZE AI 〕━━━╮',
        `${modeLabel}${continuationLabel}`,
        `📝 *Request:* ${query.slice(0, 180)}${query.length > 180 ? '…' : ''}`,
        '',
        answer,
        '',
        '╰━━━〔 ARNOLDT20 〕━━━╯'
      ].join('\n');

      await client.sendMessage(dest, { text: output }, { quoted: ms });
      await client.sendMessage(dest, { react: { text: '✅', key: ms.key } }).catch(() => {});
    } catch (error) {
      console.error('[gpt]', error.response?.data || error.message || error);
      await client.sendMessage(dest, { react: { text: '❌', key: ms.key } }).catch(() => {});
      return repondre('❌ AI request failed. The service may be busy; please try again shortly.');
    }
  }
);
