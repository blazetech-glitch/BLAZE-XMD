const fs = require('fs-extra');
const path = require('path');
const { blazetz } = require(__dirname + "/../../devblaze/blazetz");
const os = require("os");
const moment = require("moment-timezone");
const s = require(__dirname + "/../../settings");

const newsletterContext = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363421014261315@newsletter",
      newsletterName: "BLAZE XMD",
      serverMessageId: 1
    }
  }
};

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

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

blazetz({ nomCom: "menu2", categorie: "General" }, async (dest, client, commandOptions) => {
    let { ms, repondre, prefixe, nomAuteurMessage } = commandOptions;
    let { cm } = require(__dirname + "/../../devblaze/blazetz");
    let commandsByCategory = {};
    let mode = (s.MODE.toLowerCase() === "yes") ? "PUBLIC" : "PRIVATE";
    const iosMenu = s.BOT_OS === "ios";

    cm.map((com) => {
        if (!commandsByCategory[com.categorie]) commandsByCategory[com.categorie] = [];
        commandsByCategory[com.categorie].push(com.nomCom);
    });

    moment.tz.setDefault("Africa/Nairobi");
    const currentTime = moment().format('HH:mm:ss');
    const currentDate = moment().format('DD/MM/YYYY');

    let infoMessage = iosMenu
        ? `📱 *BLAZE XMD · iOS MENU*

👋 Hello, *${nomAuteurMessage}*!
📱 Platform: *${os.platform()}*
⚙️ Mode: *${mode}*
🚀 Prefix: *[ ${prefixe} ]*
⏳ Time: *${currentTime}*
📆 Date: *${currentDate}*
📟 Commands: *${cm.length}*

🎩 *Command Menu*

`
        : `┏━━━⚡ *BLAZE-TECH-V2* ⚡━━━┓
┃ 🔥  Hello, *${nomAuteurMessage}*! 🔥
┣━━━━━━━━━━━━━━━━━━━━━
┃ 📌 *System Info:*
┃ 💻 Platform: *${os.platform()}*
┣━━━━━━━━━━━━━━━━━━━━━
┃ ⚙️ *Bot Status:*
┃ 🔘 Mode: *${mode}*
┃ 🚀 Prefix: *[ ${prefixe} ]*
┃ ⏳ Time: *${currentTime}*
┃ 📆 Date: *${currentDate}*
┃ 📟 Commands: *${cm.length}*
┣━━━━━━━━━━━━━━━━━━━━━
┃ ${readMore}
┃ 🎩 *Command Menu* 🎩
┣━━━━━━━━━━━━━━━━━━━━━\n`;

    let menuMessage = "";

    for (const category in commandsByCategory) {
        if (iosMenu) {
            menuMessage += `📂 *${category.toUpperCase()}*\n`;
            commandsByCategory[category].forEach((cmd, index) => {
                menuMessage += `${index + 1}. ${prefixe}${cmd}\n`;
            });
            menuMessage += `\n`;
        } else {
            menuMessage += `┣ 🔹 *${category.toUpperCase()}* 🔹\n`;
            for (const cmd of commandsByCategory[category]) {
                menuMessage += `┃   🔸 ${cmd}\n`;
            }
            menuMessage += `┣━━━━━━━━━━━━━━━━━━━━━\n`;
        }
    }

    menuMessage += iosMenu
        ? `© *BLAZE XMD · ARNOLDT20*`
        : `┗🌟 *BLAZE XMD - Developed by ARNOLDT20!* 🌟`;

    const imagePath = path.join(__dirname, "../../public/blaze-xmd-wordmark.png");
    const imageBuffer = fs.readFileSync(imagePath);

    try {
        await client.sendMessage(dest, {
            image: imageBuffer,
            caption: infoMessage + menuMessage,
            footer: "© BLAZE XMD",
            ...newsletterContext
        }, { quoted: quotedContact });

    } catch (e) {
        console.log("❌ Menu error: " + e);
        repondre("❌ Menu error: " + e.message);
    }
});
