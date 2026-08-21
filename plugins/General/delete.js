const { blazetz } = require("../../devblaze/blazetz");

blazetz(
  {
    nomCom: "delete",
    desc: "Delete a replied message for everyone.",
    categorie: "General",
    reaction: "🗑️",
    alias: ["del", "d"]
  },
  async (dest, client, context) => {
    const {
      ms,
      repondre,
      verifGroupe = false,
      verifAdmin = false,
      isOwner = false,
      verifBlazetzAdmin = true,
      auteurMessage
    } = context || {};

    const quoted = getQuotedContextInfo(ms);
    if (!quoted?.stanzaId) {
      return repondre(
        "🗑️ *Delete a message*\n\nReply to the message you want to remove, then send `.del`."
      );
    }

    if (verifGroupe && !verifAdmin && !isOwner) {
      const senderJid = normalizeJid(auteurMessage || ms?.key?.participant || ms?.participant);
      const targetJid = normalizeJid(quoted.participant);
      if (!senderJid || !targetJid || senderJid !== targetJid) {
        return repondre("❌ Only the message author, a group admin, or the bot owner can delete this message.");
      }
    }

    if (verifGroupe && (verifAdmin || isOwner) && !verifBlazetzAdmin) {
      return repondre("❌ Please make BLAZE XMD an admin before moderating group messages.");
    }

    const targetKey = {
      remoteJid: dest,
      fromMe: Boolean(quoted.fromMe),
      id: quoted.stanzaId
    };

    if (quoted.participant) targetKey.participant = quoted.participant;

    try {
      await client.sendMessage(dest, { delete: targetKey });
      return null;
    } catch (error) {
      console.error("[Delete] Failed to delete replied message:", error);
      return repondre(
        "❌ WhatsApp could not delete that message. It may be outside the deletion window, unavailable to the bot, or restricted by chat permissions."
      );
    }
  }
);

function getQuotedContextInfo(message) {
  const candidates = [
    message?.message?.extendedTextMessage?.contextInfo,
    message?.message?.imageMessage?.contextInfo,
    message?.message?.videoMessage?.contextInfo,
    message?.message?.documentMessage?.contextInfo,
    message?.message?.audioMessage?.contextInfo,
    message?.message?.stickerMessage?.contextInfo,
    message?.message?.conversation?.contextInfo
  ];

  return candidates.find((info) => info?.stanzaId) || null;
}

function normalizeJid(value) {
  if (!value) return "";
  if (typeof value === "object") {
    value = value.phoneNumber || value.id || value.jid || "";
  }
  return String(value).split(":")[0].trim();
}
