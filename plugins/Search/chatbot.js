const { bmbtz } = require('../../devblaze/blazetz');
const {
  toggleChatbot,
  setChatbotState,
  isChatbotEnabled
} = require('../../handlers/chatbot');

bmbtz(
  {
    nomCom: 'chatbot',
    categorie: 'Search',
    reaction: '🤖',
    alias: ['cb', 'ai']
  },
  async (dest, client, context) => {
    const { arg = [], repondre, verifGroupe, auteurMessage } = context;

    if (verifGroupe) {
      return repondre('❌ AI auto-reply works in private chats only. Open a private chat with BLAZE XMD.');
    }

    const userJid = auteurMessage || dest;
    const action = String(arg[0] || 'toggle').toLowerCase();

    if (['help', '?'].includes(action)) {
      return repondre([
        '🤖 *BLAZE XMD AI CHATBOT*',
        '',
        '`.chatbot on` — enable automatic private replies',
        '`.chatbot off` — disable automatic private replies',
        '`.chatbot status` — check the current state',
        '`.chatbot` — toggle the current state',
        '',
        'After enabling it, send a normal private message without a command prefix.'
      ].join('\n'));
    }

    if (action === 'status') {
      return repondre(isChatbotEnabled(userJid)
        ? '✅ AI chatbot is currently *ON* for this private chat.'
        : '⚪ AI chatbot is currently *OFF* for this private chat.\nUse `.chatbot on` to enable it.');
    }

    if (['on', 'enable', 'start'].includes(action)) {
      setChatbotState(userJid, true);
      return repondre('✅ *BLAZE XMD AI chatbot enabled.*\nSend a normal private message to receive an AI reply.');
    }

    if (['off', 'disable', 'stop'].includes(action)) {
      setChatbotState(userJid, false);
      return repondre('🛑 *BLAZE XMD AI chatbot disabled* for this private chat.');
    }

    if (action === 'toggle') {
      const enabled = toggleChatbot(userJid);
      return repondre(enabled
        ? '✅ *BLAZE XMD AI chatbot enabled.*\nSend a normal private message to begin.'
        : '🛑 *BLAZE XMD AI chatbot disabled.*');
    }

    return repondre('❌ Unknown chatbot option. Use `.chatbot help`.');
  }
);
