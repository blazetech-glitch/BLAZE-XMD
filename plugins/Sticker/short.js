const { blazetz } = require("../../devblaze/blazetz");
const axios = require("axios");

// VCard Contact (BLAZE VERIFIED ✅)
const quotedContact = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "BLAZE VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:BLAZE VERIFIED ✅
ORG:BLAZE-TECH BOT;
TEL;type=CELL;type=VOICE;waid=255627417402:+255627417402
END:VCARD`
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

blazetz(
  {
    nomCom: "short",
    alias: ["tiny", "shorturl", "shorten", "urlshort"],
    categorie: "Sticker",
    author: "ARNOLDT20",
    reaction: "General"
  },
  async (from, conn, context) => {

    const { arg, repondre } = context;

    if (!arg[0]) {
      return repondre("*🏷️ Please provide a link.*\n\nExample: .short https://example.com");
    }

    try {
      const link = arg[0].trim();
      let parsedUrl;
      try {
        parsedUrl = new URL(link);
      } catch {
        return repondre("❌ Please provide a valid URL beginning with http:// or https://.");
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return repondre("❌ Only http:// and https:// links can be shortened.");
      }

      const response = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(link)}`
      );

      const shortenedUrl = String(response.data || '').trim();
      if (!/^https?:\/\//i.test(shortenedUrl)) {
        return repondre("❌ The shortening service returned an invalid result.");
      }

      // Box style caption
      const caption = `┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🛡️ *URL Shortener*
┣━━━━━━━━━━━━━━━━━━━━━━━
┃ 🔗 Original:
┃ ${link}
┣━━━━━━━━━━━━━━━━━━━━━━━
┃ ✂️ Shortened:
┃ ${shortenedUrl}
┗━━━━━━━━━━━━━━━━━━━━━━━
🔗 Powered by BLAZE XMD`;

      await conn.sendMessage(
        from,
        {
          text: caption,
          contextInfo: newsletterContext
        },
        { quoted: quotedContact }
      );

    } catch (error) {
      console.error("TINY ERROR:", error);
      repondre("❌ An error occurred while shortening the URL. Please try again.");
    }
  }
);
