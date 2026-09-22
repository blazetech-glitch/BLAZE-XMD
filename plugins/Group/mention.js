"use strict";

const { blazetz } = require("../../devblaze/blazetz");
const { getMentionState, updateMentionState } = require("../../lib/mentionModeration");
const { getCachedSettingsSync, updateCachedSetting } = require("../../lib/settingsCache");

function help() {
  return `🛡️ *MENTION PROTECTION*

Group commands:
• .antimention on|off
• .antimention action/delete|warn|remove
• .antimention status

Owner command:
• .antistatusmention on|off
• .antistatusmention status`;
}

blazetz({ nomCom: "antimention", alias: ["antitag", "antimentions"], categorie: "Group", reaction: "🛡️" }, async (dest, client, context) => {
  const { arg = [], repondre, verifGroupe, verifAdmin, superUser } = context;
  if (!verifGroupe) return repondre("🚫 This command works in groups only.");
  if (!(verifAdmin || superUser)) return repondre("🚫 Only group admins can control anti-mention.");
  const option = String(arg[0] || "status").toLowerCase();
  const state = await getMentionState(dest);
  if (option === "status") {
    return repondre(`🛡️ *ANTI-MENTION*\n\nStatus: *${state.antiMention.toUpperCase()}*\nAction: *${state.action.toUpperCase()}*`);
  }
  if (option === "on" || option === "off") {
    const next = await updateMentionState(dest, { antiMention: option });
    return repondre(`✅ Anti-mention is now *${next.antiMention.toUpperCase()}*.`);
  }
  if (option === "action") {
    const action = String(arg[1] || "").toLowerCase();
    if (!["delete", "warn", "remove"].includes(action)) return repondre("Use: `.antimention action delete|warn|remove`");
    const next = await updateMentionState(dest, { action });
    return repondre(`✅ Anti-mention action set to *${next.action.toUpperCase()}*.`);
  }
  return repondre(help());
});

blazetz({ nomCom: "antistatusmention", alias: ["statusmention"], categorie: "Settings", reaction: "🛡️" }, async (dest, client, context) => {
  const { arg = [], repondre, superUser } = context;
  if (!superUser) return repondre("🚫 Only the bot owner can control anti-status-mention.");
  const option = String(arg[0] || "status").toLowerCase();
  const current = String(getCachedSettingsSync().ANTI_STATUS_MENTION || "off").toLowerCase();
  if (option === "status") return repondre(`🛡️ *ANTI-STATUS-MENTION*\n\nStatus: *${current.toUpperCase()}*\nMentions in incoming WhatsApp Status updates are ignored by automatic status actions when enabled.`);
  if (option !== "on" && option !== "off") return repondre("Use: `.antistatusmention on`, `.antistatusmention off`, or `.antistatusmention status`");
  await updateCachedSetting("ANTI_STATUS_MENTION", option);
  return repondre(`✅ Anti-status-mention is now *${option.toUpperCase()}*.`);
});
