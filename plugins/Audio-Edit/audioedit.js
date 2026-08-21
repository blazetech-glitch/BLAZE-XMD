const { blazetz } = require("../../devblaze/blazetz");
const fs = require("fs");
const { exec } = require("child_process");

const filename = `${Math.random().toString(36)}`;

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

// DEEP
blazetz({
  nomCom: "deep",
  categorie: "Audio-Edit"
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, msgRepondu } = commandeOptions;
  if (!msgRepondu || !msgRepondu.audioMessage) return repondre("❗ Please mention an audio");
  const media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
  const ran = `${filename}.mp3`;
  const settings = "-af atempo=4/4,asettingsrate=44500*2/3";

  exec(`ffmpeg -i ${media} ${settings} ${ran}`, (err) => {
    fs.unlinkSync(media);
    if (err) return repondre("❌ Error during processing: " + err);
    const buffer = fs.readFileSync(ran);
    client.sendMessage(dest, {
      audio: buffer,
      mimetype: "audio/mpeg",
      contextInfo: {
        ...newsletterContext
      }
    }, { quoted: quotedContact });
    fs.unlinkSync(ran);
  });
});

// BASS
blazetz({
  nomCom: "bass",
  categorie: "Audio-Edit"
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, msgRepondu } = commandeOptions;
  if (!msgRepondu || !msgRepondu.audioMessage) return repondre("❗ Please mention an audio");
  const media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
  const ran = `${filename}.mp3`;
  const settings = "-af equalizer=f=18:width_type=o:width=2:g=14";

  exec(`ffmpeg -i ${media} ${settings} ${ran}`, (err) => {
    fs.unlinkSync(media);
    if (err) return repondre("❌ Error during processing: " + err);
    const buffer = fs.readFileSync(ran);
    client.sendMessage(dest, {
      audio: buffer,
      mimetype: "audio/mpeg",
      contextInfo: {
        ...newsletterContext
      }
    }, { quoted: quotedContact });
    fs.unlinkSync(ran);
  });
});

// REVERSE
blazetz({
  nomCom: "reverse",
  categorie: "Audio-Edit"
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, msgRepondu } = commandeOptions;
  if (!msgRepondu || !msgRepondu.audioMessage) return repondre("❗ Please mention an audio");
  const media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
  const ran = `${filename}.mp3`;
  const settings = '-filter_complex "areverse"';

  exec(`ffmpeg -i ${media} ${settings} ${ran}`, (err) => {
    fs.unlinkSync(media);
    if (err) return repondre("❌ Error during processing: " + err);
    const buffer = fs.readFileSync(ran);
    client.sendMessage(dest, {
      audio: buffer,
      mimetype: "audio/mpeg",
      contextInfo: {
        ...newsletterContext
      }
    }, { quoted: quotedContact });
    fs.unlinkSync(ran);
  });
});

// SLOW
blazetz({
  nomCom: "slow",
  categorie: "Audio-Edit"
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, msgRepondu } = commandeOptions;
  if (!msgRepondu || !msgRepondu.audioMessage) return repondre("❗ Please mention an audio");
  const media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
  const ran = `${filename}.mp3`;
  const settings = '-filter:a "atempo=0.8,asettingsrate=44100"';

  exec(`ffmpeg -i ${media} ${settings} ${ran}`, (err) => {
    fs.unlinkSync(media);
    if (err) return repondre("❌ Error during processing: " + err);
    const buffer = fs.readFileSync(ran);
    client.sendMessage(dest, {
      audio: buffer,
      mimetype: "audio/mpeg",
      contextInfo: {
        ...newsletterContext
      }
    }, { quoted: quotedContact });
    fs.unlinkSync(ran);
  });
});

// TEMPO
blazetz({
  nomCom: "tempo",
  categorie: "Audio-Edit"
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, msgRepondu } = commandeOptions;
  if (!msgRepondu || !msgRepondu.audioMessage) return repondre("❗ Please mention an audio");
  const media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
  const ran = `${filename}.mp3`;
  const settings = '-filter:a "atempo=0.9,asettingsrate=65100"';

  exec(`ffmpeg -i ${media} ${settings} ${ran}`, (err) => {
    fs.unlinkSync(media);
    if (err) return repondre("❌ Error during processing: " + err);
    const buffer = fs.readFileSync(ran);
    client.sendMessage(dest, {
      audio: buffer,
      mimetype: "audio/mpeg",
      contextInfo: {
        ...newsletterContext
      }
    }, { quoted: quotedContact });
    fs.unlinkSync(ran);
  });
});

// NIGHTCORE
blazetz({
  nomCom: "nightcore",
  categorie: "Audio-Edit"
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, msgRepondu } = commandeOptions;
  if (!msgRepondu || !msgRepondu.audioMessage) return repondre("❗ Please mention an audio");
  const media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
  const ran = `${filename}.mp3`;
  const settings = '-filter:a "atempo=1.07,asettingsrate=44100*1.20"';

  exec(`ffmpeg -i ${media} ${settings} ${ran}`, (err) => {
    fs.unlinkSync(media);
    if (err) return repondre("❌ Error during processing: " + err);
    const buffer = fs.readFileSync(ran);
    client.sendMessage(dest, {
      audio: buffer,
      mimetype: "audio/mpeg",
      contextInfo: {
        ...newsletterContext
      }
    }, { quoted: quotedContact });
    fs.unlinkSync(ran);
  });
});
