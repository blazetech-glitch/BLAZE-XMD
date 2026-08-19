const { bmbtz } = require("../../devblaze/blazetz");
const { toggleChatbot } = require("../../handlers/chatbot");

bmbtz(
    {
        nomCom: "chatbot",
        categorie: "Search",
        reaction: "🤖",
        alias: ["cb"]
    },
    async (dest, client, { repondre, verifGroupe, auteurMessage }) => {
        if (verifGroupe) {
            return repondre("❌ Chatbot can only be used in private messages.");
        }

        const enabled = toggleChatbot(auteurMessage || dest);
        if (enabled) {
            return repondre(
                "✅ *BLAZE XMD AI Chatbot Enabled*\n\n" +
                "I will now respond to your messages in this private chat.\n" +
                "Send me anything to start a conversation.\n\n" +
                "Use .chatbot again to disable me."
            );
        }

        return repondre("❌ *Chatbot Disabled*\n\nI will no longer auto-respond in this private chat.");
    }
);
