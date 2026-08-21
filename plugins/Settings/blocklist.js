const { blazetz } = require("../../devblaze/blazetz");

// VCard Contact
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "BLAZE VERIFIED ✅",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:BLAZE VERIFIED ✅\nORG:BLAZE-TECH BOT;\nTEL;type=CELL;type=VOICE;waid=255627417402:+255627417402\nEND:VCARD"
    }
  }
};

// Newsletter context
const newsletterContext = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363421014261315@newsletter",
    newsletterName: "𝙱𝙻𝙰𝚉𝙴 𝚇𝙼𝙳",
    serverMessageId: 1
  }
};

blazetz({
  nomCom: "blocklist",
  aliases: ["listblock", "blacklist"],
  reaction: '☘️',
  categorie: "Settings"
}, async (dest, client, commandeOptions) => {
  const { repondre } = commandeOptions;

  try {
    let blocklist = await client.fetchBlocklist();

    if (blocklist.length > 0) {
      await client.sendMessage(dest, {
        text: `🧾 You have blocked *${blocklist.length}* contact(s). Fetching list...`,
        contextInfo: {
          ...newsletterContext
        }
      }, { quoted: quotedContact });

      let output = `╭───❖ 「 *BLOCKED CONTACTS* 」\n`;

      for (let user of blocklist) {
        const number = user.split('@')[0];
        output += `│ 🔒 +${number}\n`;
      }

      output += `╰───────────────\n🔐 *By BLAZE TECH*`;

      await client.sendMessage(dest, {
        text: output,
        contextInfo: {
          ...newsletterContext
        }
      }, { quoted: quotedContact });

    } else {
      await client.sendMessage(dest, {
        text: "✅ You have no blocked contacts.",
        contextInfo: {
          ...newsletterContext
        }
      }, { quoted: quotedContact });
    }
  } catch (e) {
    await client.sendMessage(dest, {
      text: "❌ An error occurred while accessing blocked users.\n\n" + e,
      contextInfo: {
        ...newsletterContext
      }
    }, { quoted: quotedContact });
  }
});
// blaze check number fixed ✅✅
