const { blazetz } = require('../../devblaze/blazetz');
const {
  toggleChatbot,
  setChatbotState,
  isChatbotEnabled
} = require('../../handlers/chatbot');

blazetz(
  {
    nomCom: 'chatbot',
    categorie: 'Search',
    author: 'ARNOLDT20',
    reaction: '🤖',
    alias: ['cb']
  },
  async (dest, client, context) => {
    const { arg = [], repondre, verifGroupe, auteurMessage } = context;

    if (verifGroupe) {
      const action = String(arg[0] || 'toggle').toLowerCase();
      if (['help', '?'].includes(action)) {
        return repondre([
          '🤖 *BLAZE XMD GROUP CHATBOT*',
          '',
          '`.chatbot on` — enable replies in this group',
          '`.chatbot off` — disable replies in this group',
          '`.chatbot status` — check the group state',
          '',
          'Any group participant can control this setting.',
          'When enabled, the bot replies only when a member replies to the bot message.'
        ].join('\\n'));
      }

      if (action === 'status') {
        return repondre(isChatbotEnabled(dest)
          ? '✅ Group chatbot is *ON*. Reply to a BLAZE XMD message to receive an AI response.'
          : '⚪ Group chatbot is *OFF*. Use `.chatbot on` to enable it.');
      }

      if (['on', 'enable', 'start'].includes(action)) {
        setChatbotState(dest, true);
        return repondre('✅ Group chatbot enabled. It will answer only replies directed to BLAZE XMD.');
      }

      if (['off', 'disable', 'stop'].includes(action)) {
        setChatbotState(dest, false);
        return repondre('🛑 Group chatbot disabled.');
      }

      if (action === 'toggle') {
        const enabled = toggleChatbot(dest);
        return repondre(enabled
          ? '✅ Group chatbot enabled. Reply to BLAZE XMD messages to get an AI response.'
          : '🛑 Group chatbot disabled.');
      }

      return repondre('❌ Unknown group chatbot option. Use `.chatbot help`.');
    }

    const userJid = auteurMessage || dest;
    const action = String(arg[0] || 'toggle').toLowerCase();

    if (['help', '?'].includes(action)) {
      return repondre([
        '🤖 *BLAZE XMD AI CHATBOT*',
        '',
        '`.chatbot on` — enable automatic private replies',
        '`.chatbot off` — disable automatic private replies',
        '`.chatbot on` in a group — enable reply-only group AI',
        '`.chatbot off` in a group — disable group AI',
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
