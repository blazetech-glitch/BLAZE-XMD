const axios = require('axios');
const { getBusinessProfile, businessPrompt } = require('../lib/businessProfile');
const fs = require('fs');
const path = require('path');

const CHATGPT_API = process.env.BLAZE_CHATBOT_API || 'https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/whatsapp-chat';
const HISTORY_FILE = path.join(__dirname, '../asset/chatbot_history.json');
const HISTORY_RETENTION_MS = 72 * 60 * 60 * 1000;
const REPLY_INTERVAL_MS = 10_000;
const MAX_HISTORY_MESSAGES = 10;

const chatbotEnabled = new Map();
const lastReplyTime = new Map();
const conversationHistory = new Map();
const userLastActivity = new Map();
const gptReplyLastTime = new Map();
const businessReplyLastTime = new Map();

function normalizeUser(jid) {
  return String(jid || '').split(':')[0].trim();
}

function userKeys(...jids) {
  return [...new Set(jids.map(normalizeUser).filter(Boolean))];
}

function isPrivateChat(from) {
  return Boolean(from) && !from.endsWith('@g.us') && from !== 'status@broadcast';
}

function isGroupChat(from) {
  return Boolean(from) && from.endsWith('@g.us');
}

function isForwardedMessage(message) {
  const content = message?.message;
  if (!content || typeof content !== 'object') return false;

  return Object.values(content).some((node) => {
    if (!node || typeof node !== 'object') return false;
    const contextInfo = node.contextInfo;
    return contextInfo?.isForwarded === true || Number(contextInfo?.forwardingScore || 0) > 0;
  });
}

function isFromBot(message, client) {
  if (!message || !client) return false;
  if (message.key?.fromMe) return true;

  const botJid = client.user?.id;
  const senderJid = message.key?.participant || message.key?.remoteJid;
  if (!botJid || !senderJid) return false;

  return normalizeUser(botJid.split('@')[0]) === normalizeUser(senderJid.split('@')[0]);
}

function loadHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return;
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    const now = Date.now();

    for (const [user, entry] of Object.entries(data || {})) {
      if (!entry || now - Number(entry.lastActivity || 0) >= HISTORY_RETENTION_MS) continue;
      if (!Array.isArray(entry.history)) continue;
      conversationHistory.set(user, entry.history.slice(-MAX_HISTORY_MESSAGES));
      userLastActivity.set(user, Number(entry.lastActivity || now));
      if (entry.enabled === true) chatbotEnabled.set(user, true);
    }

    console.log(`[Chatbot] Loaded history for ${conversationHistory.size} users`);
  } catch (error) {
    console.error('[Chatbot] Error loading history:', error.message);
  }
}

function saveHistory() {
  try {
    fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
    const data = {};
    for (const [user, history] of conversationHistory) {
      data[user] = {
        history: history.slice(-MAX_HISTORY_MESSAGES),
        lastActivity: userLastActivity.get(user) || Date.now(),
        enabled: chatbotEnabled.get(user) === true
      };
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[Chatbot] Error saving history:', error.message);
  }
}

function setChatbotState(jid, enabled) {
  const user = normalizeUser(jid);
  if (!user) return false;

  chatbotEnabled.set(user, Boolean(enabled));
  chatbotEnabled.set(user.split('@')[0], Boolean(enabled));
  if (enabled) {
    if (!conversationHistory.has(user)) conversationHistory.set(user, []);
    lastReplyTime.set(user, 0);
    userLastActivity.set(user, Date.now());
  }
  saveHistory();
  console.log(`[Chatbot] ${enabled ? 'Enabled' : 'Disabled'} for ${user}`);
  return Boolean(enabled);
}

function isChatbotEnabled(jid) {
  return userKeys(jid).some((key) => chatbotEnabled.get(key) === true || chatbotEnabled.get(key.split('@')[0]) === true);
}

function toggleChatbot(jid) {
  return setChatbotState(jid, !isChatbotEnabled(jid));
}

async function getAIResponse(user, message, { concise = false } = {}) {
  const history = conversationHistory.get(user) || [];
  history.push({ role: 'user', content: message });
  if (history.length > MAX_HISTORY_MESSAGES) history.splice(0, history.length - MAX_HISTORY_MESSAGES);
  conversationHistory.set(user, history);

  try {
    const requestMessage = concise
      ? `Reply briefly and directly in 1-3 short sentences. Do not add greetings, repeated context, long explanations, or decorative sections unless the user asks for detail.\n\nUser message:\n${message}`
      : message;
    const response = await axios.post(CHATGPT_API, {
      message: requestMessage,
      conversation_id: user
    }, {
      timeout: 60_000,
      headers: { 'Content-Type': 'application/json' }
    });

    const data = response.data || {};
    let aiResponse = data.reply ?? data.response ?? data.answer ?? data.result;
    if (aiResponse === undefined || aiResponse === null) {
      throw new Error('AI service returned no response text.');
    }

    aiResponse = String(aiResponse).trim();
    if (concise && aiResponse.length > 900) {
      const shortened = aiResponse.slice(0, 900);
      const boundary = Math.max(shortened.lastIndexOf('. '), shortened.lastIndexOf('? '), shortened.lastIndexOf('! '));
      aiResponse = `${shortened.slice(0, boundary > 250 ? boundary + 1 : 900).trim()}…`;
    } else {
      aiResponse = aiResponse.slice(0, 4000);
    }
    if (!aiResponse) throw new Error('AI service returned an empty response.');

    history.push({ role: 'assistant', content: aiResponse });
    if (history.length > MAX_HISTORY_MESSAGES) history.splice(0, history.length - MAX_HISTORY_MESSAGES);
    userLastActivity.set(user, Date.now());
    saveHistory();
    return aiResponse;
  } catch (error) {
    console.error('[Chatbot] AI request failed:', error.response?.data || error.message);
    return '❌ The AI service is temporarily unavailable. Please try again shortly.';
  }
}

function canonicalJid(jid) {
  return String(jid || '').split('@')[0].split(':')[0].trim();
}

function identityCandidates(client, jid) {
  const values = [jid];
  if (typeof client?.decodeJid === 'function' && jid) {
    try { values.push(client.decodeJid(jid)); } catch (_) {}
  }
  return values.map(canonicalJid).filter(Boolean);
}

function isReplyToBot(message, client) {
  const contextInfo = message?.message?.extendedTextMessage?.contextInfo
    || message?.message?.imageMessage?.contextInfo
    || message?.message?.videoMessage?.contextInfo
    || message?.message?.audioMessage?.contextInfo;
  if (!contextInfo) return false;

  const botIds = [
    client?.user?.id,
    client?.user?.jid,
    client?.user?.lid,
    client?.user?.phone,
    client?.user?.phoneNumber
  ].flatMap((jid) => identityCandidates(client, jid));
  const replyTargets = [contextInfo.participant, contextInfo.participantAlt, contextInfo.remoteJid]
    .flatMap((jid) => identityCandidates(client, jid));
  const mentionedBot = (contextInfo.mentionedJid || [])
    .some((jid) => identityCandidates(client, jid).some((candidate) => botIds.includes(candidate)));

  return replyTargets.some((target) => botIds.includes(target)) || mentionedBot;
}

function extractQuotedText(message) {
  const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return '';
  return String(
    quoted.conversation
      || quoted.extendedTextMessage?.text
      || quoted.imageMessage?.caption
      || quoted.videoMessage?.caption
      || ''
  ).trim();
}

function isAiResponse(text) {
  return /^╭━━━〔\s*🤖\s*BLAZE AI/i.test(text)
    || /^🤖\s*\*?BLAZE GPT/i.test(text)
    || /╰━━━〔\s*ARNOLDT20\s*〕━━━╯/i.test(text);
}

async function handleAutomaticGptReply(client, message, { from, body }) {
  if (!body || body.startsWith('.') || !isPrivateChat(from)) return false;
  const quotedText = extractQuotedText(message);
  if (!isAiResponse(quotedText)) return false;

  const now = Date.now();
  const lastReply = gptReplyLastTime.get(from) || 0;
  if (now - lastReply < REPLY_INTERVAL_MS) return true;
  gptReplyLastTime.set(from, now);

  try {
    const response = await axios.post(CHATGPT_API, {
      message: [
        'Continue the conversation using the previous AI answer as context.',
        'Do not repeat the entire previous answer unless requested.',
        '',
        `Previous AI answer:\n${quotedText.slice(0, 3800)}`,
        '',
        `User follow-up:\n${String(body).slice(0, 1800)}`
      ].join('\n'),
      conversation_id: `gpt:${from}`
    }, {
      timeout: 60_000,
      headers: { 'Content-Type': 'application/json' }
    });

    const data = response.data || {};
    const answer = String(data.reply ?? data.response ?? data.answer ?? data.result ?? '').trim().slice(0, 3800);
    if (!answer) throw new Error('AI service returned an empty continuation.');

    await client.sendMessage(from, {
      text: `╭━━━〔 🤖 BLAZE AI 〕━━━╮\n🔁 *Conversation continued*\n\n${answer}\n\n╰━━━〔 ARNOLDT20 〕━━━╯`
    }, { quoted: message });
  } catch (error) {
    console.error('[Chatbot] Automatic GPT continuation failed:', error.response?.data || error.message);
    await client.sendMessage(from, { text: '❌ I could not continue that AI conversation right now. Please try again shortly.' }, { quoted: message });
  }
  return true;
}

async function handleBusinessCustomerReply(client, message, { from, body }) {
  if (!body || body.startsWith('.') || !isPrivateChat(from)) return false;
  const profile = await getBusinessProfile();
  if (profile.enabled !== 'on') return false;

  const now = Date.now();
  const lastReply = businessReplyLastTime.get(from) || 0;
  if (now - lastReply < 3_000) return true;
  businessReplyLastTime.set(from, now);

  try {
    const response = await axios.post(CHATGPT_API, {
      message: businessPrompt(profile, body),
      conversation_id: `business:${from}`
    }, {
      timeout: 45_000,
      headers: { 'Content-Type': 'application/json' }
    });
    const data = response.data || {};
    const answer = String(data.reply ?? data.response ?? data.answer ?? data.result ?? '').trim().slice(0, 3800);
    if (!answer) throw new Error('Business AI returned an empty response.');
    await client.sendMessage(from, { text: answer }, { quoted: message });
  } catch (error) {
    console.error('[Business assistant] response failed:', error.response?.data || error.message);
    await client.sendMessage(from, { text: 'Thank you for contacting us. We are checking your request and will get back to you shortly.' }, { quoted: message });
  }
  return true;
}

async function handleChatbotMessage(client, message, { from, sender, body }) {
  if (isFromBot(message, client) || isForwardedMessage(message) || !body || body.startsWith('.')) return;
  if (from === 'status@broadcast') return;

  if (isPrivateChat(from)) {
    if (await handleAutomaticGptReply(client, message, { from, body })) return;
    if (await handleBusinessCustomerReply(client, message, { from, body })) return;

    const keys = userKeys(sender, from);
    const user = keys[0] || normalizeUser(from);
    if (!isChatbotEnabled(user)) return;

    const now = Date.now();
    const lastReply = lastReplyTime.get(user) || 0;
    if (now - lastReply < REPLY_INTERVAL_MS) return;
    lastReplyTime.set(user, now);

    const aiResponse = await getAIResponse(user, body);
    if (aiResponse) await client.sendMessage(from, { text: aiResponse }, { quoted: message });
    return;
  }

  if (!isGroupChat(from) || !isChatbotEnabled(from) || !isReplyToBot(message, client)) return;

  const now = Date.now();
  const lastReply = lastReplyTime.get(from) || 0;
  if (now - lastReply < REPLY_INTERVAL_MS) return;
  lastReplyTime.set(from, now);

  const aiResponse = await getAIResponse(`group:${from}`, body, { concise: true });
  if (aiResponse) await client.sendMessage(from, { text: aiResponse }, { quoted: message });
}

loadHistory();
setInterval(saveHistory, 5 * 60 * 1000);

module.exports = {
  handleChatbotMessage,
  handleAutomaticGptReply,
  handleBusinessCustomerReply,
  toggleChatbot,
  setChatbotState,
  isChatbotEnabled,
  isReplyToBot,
  isForwardedMessage
};
