const axios = require("axios");
const fs = require("fs");
const path = require("path");

// BLAZE XMD private-chat AI configuration.
const CHATGPT_API = process.env.BLAZE_CHATBOT_API || "https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/whatsapp-chat";
const HISTORY_FILE = path.join(__dirname, "../asset/chatbot_history.json");
const HISTORY_RETENTION_MS = 72 * 60 * 60 * 1000;
const REPLY_INTERVAL_MS = 10000;

const chatbotEnabled = new Map();
const lastReplyTime = new Map();
const conversationHistory = new Map();
const userLastActivity = new Map();

function normalizeUser(jid) {
    return String(jid || "").split(":")[0].trim();
}

function userKeys(...jids) {
    return [...new Set(jids.map(normalizeUser).filter(Boolean))];
}

function isPrivateChat(from) {
    return Boolean(from) && !from.endsWith("@g.us") && from !== "status@broadcast";
}

function isFromBot(message, client) {
    if (!message || !client) return false;
    if (message.key?.fromMe) return true;

    const botJid = client.user?.id;
    const senderJid = message.key?.participant || message.key?.remoteJid;
    if (!botJid || !senderJid) return false;

    return normalizeUser(botJid.split("@")[0]) === normalizeUser(senderJid.split("@")[0]);
}

function loadHistory() {
    try {
        if (!fs.existsSync(HISTORY_FILE)) return;
        const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
        const now = Date.now();

        for (const [user, entry] of Object.entries(data || {})) {
            if (!entry || now - Number(entry.lastActivity || 0) >= HISTORY_RETENTION_MS) continue;
            if (!Array.isArray(entry.history)) continue;
            conversationHistory.set(user, entry.history.slice(-10));
            userLastActivity.set(user, Number(entry.lastActivity));
            if (entry.enabled === true) chatbotEnabled.set(user, true);
        }

        console.log(`[Chatbot] Loaded history for ${conversationHistory.size} users`);
    } catch (error) {
        console.error("[Chatbot] Error loading history:", error.message);
    }
}

function saveHistory() {
    try {
        const data = {};
        for (const [user, history] of conversationHistory) {
            data[user] = {
                history: history.slice(-10),
                lastActivity: userLastActivity.get(user) || Date.now(),
                enabled: chatbotEnabled.get(user) === true
            };
        }
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("[Chatbot] Error saving history:", error.message);
    }
}

async function getAIResponse(user, message) {
    const history = conversationHistory.get(user) || [];
    history.push({ role: "user", content: message });
    if (history.length > 10) history.splice(0, history.length - 10);
    conversationHistory.set(user, history);

    try {
        const response = await axios.post(CHATGPT_API, {
            message,
            conversation_id: user
        }, {
            timeout: 60000,
            headers: { "Content-Type": "application/json" }
        });

        const data = response.data || {};
        let aiResponse = data.reply ?? data.response ?? data.answer ?? data.result;
        if (aiResponse === undefined || aiResponse === null) {
            aiResponse = "Sorry, I'm having trouble responding right now.";
        }
        if (typeof aiResponse !== "string") aiResponse = String(aiResponse);
        aiResponse = aiResponse.trim().slice(0, 4000);

        history.push({ role: "assistant", content: aiResponse });
        if (history.length > 10) history.splice(0, history.length - 10);
        userLastActivity.set(user, Date.now());
        saveHistory();
        return aiResponse;
    } catch (error) {
        console.error("[Chatbot] AI request failed:", error.response?.data || error.message);
        return "Sorry, I'm having trouble responding right now. Please try again later.";
    }
}

function toggleChatbot(jid) {
    const user = normalizeUser(jid);
    const enabled = !Boolean(chatbotEnabled.get(user));
    chatbotEnabled.set(user, enabled);
    // Keep the plain number key too, because WhatsApp may alternate between
    // phone JIDs and LID JIDs across messages from the same private chat.
    chatbotEnabled.set(user.split("@")[0], enabled);
    console.log(`[Chatbot] ${enabled ? "Enabled" : "Disabled"} for ${user}`);

    if (enabled) {
        conversationHistory.set(user, []);
        lastReplyTime.set(user, 0);
        userLastActivity.set(user, Date.now());
    }

    saveHistory();
    return enabled;
}

async function handleChatbotMessage(client, message, { from, sender, body }) {
    if (!isPrivateChat(from) || isFromBot(message, client)) return;
    if (!body || body.startsWith(".")) return;

    const keys = userKeys(sender, from);
    const user = keys[0] || normalizeUser(from);
    const enabled = keys.some((key) => chatbotEnabled.get(key) === true || chatbotEnabled.get(key.split("@")[0]) === true);
    if (!enabled) return;

    console.log(`[Chatbot] Handling private message for ${user}`);
    const now = Date.now();
    const lastReply = lastReplyTime.get(user) || 0;
    if (now - lastReply < REPLY_INTERVAL_MS) return;
    lastReplyTime.set(user, now);

    const aiResponse = await getAIResponse(user, body);
    if (aiResponse) {
        await client.sendMessage(from, { text: aiResponse }, { quoted: message });
    }
}

loadHistory();
setInterval(saveHistory, 5 * 60 * 1000);

module.exports = {
    handleChatbotMessage,
    toggleChatbot
};
