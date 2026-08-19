const { bmbtz } = require("../../devblaze/blazetz");
const { downloadMediaMessage, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { exec } = require('child_process');
const { writeFile } = require("fs/promises");
const fs = require('fs-extra');
const moment = require("moment-timezone");

bmbtz({
  nomCom: 'report',
  aliases: 'spread',
  desc: 'report anything to the bot developer',
  categorie: "General",
  reaction: '🍂'
}, async (bot, client, context) => {
  const { arg, repondre, superUser, nomAuteurMessage, ms } = context;

  if (!arg[0]) {
    return repondre("After the command *broadcast*, type your message to be sent to the specified contacts.");
  }

  if (!superUser) {
    return repondre("Only for the owner.");
  }

  // Specified contacts
  const contacts = [
    '255627417402@s.whatsapp.net',
    '255627417402@s.whatsapp.net',
    '255627417402@s.whatsapp.net'
  ];

  await repondre("*BLAZE-TECH-BOT is sending your message to Developer contacts 🤦🤷*...");

  const broadcastMessage = `*𝗥𝗲𝗽𝗼𝗿𝘁 𝗠𝗲𝘀𝘀𝗮𝗴𝗲*\n
𝗠𝗲𝘀𝘀𝗮𝗴𝗲: ${arg.join(" ")}\n
𝗦𝗲𝗻𝗱𝗲𝗿 𝗡𝗮𝗺𝗲 : ${nomAuteurMessage}`;

  for (let contact of contacts) {
    await client.sendMessage(contact, {
      image: { url: 'https://files.catbox.moe/rpea5k.jpg' },
      caption: broadcastMessage,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363421014261315@newsletter",
          newsletterName: "𝙱𝙻𝙰𝚉𝙴 𝚇𝙼𝙳",
          serverMessageId: 1
        }
      }
    }, { quoted: ms });
  }
});
