"use strict";

const { getSettings, updateSetting } = require("../database/db");

const KEY_PREFIX = "BLAZE_GROUP_MENTION_";
const ACTIONS = new Set(["delete", "warn", "remove"]);

function keyFor(groupJid) {
  return `${KEY_PREFIX}${groupJid}`;
}

function normalizeState(value) {
  const state = value && typeof value === "object" ? value : {};
  return {
    antiMention: state.antiMention === "on" ? "on" : "off",
    antiStatusMention: state.antiStatusMention === "on" ? "on" : "off",
    action: ACTIONS.has(state.action) ? state.action : "delete"
  };
}

async function getMentionState(groupJid) {
  const settings = await getSettings();
  let parsed = {};
  try { parsed = JSON.parse(settings[keyFor(groupJid)] || "{}"); } catch (_) {}
  return normalizeState(parsed);
}

async function updateMentionState(groupJid, patch) {
  const state = normalizeState({ ...(await getMentionState(groupJid)), ...patch });
  await updateSetting(keyFor(groupJid), JSON.stringify(state));
  return state;
}

async function shouldIgnoreStatusMention(message) {
  const settings = await getSettings();
  if (String(settings.ANTI_STATUS_MENTION || "off").toLowerCase() !== "on") return false;
  return getMentionedJids(message).length > 0;
}

function getContextInfo(message) {
  if (!message || typeof message !== "object") return null;
  const body = message.message || message;
  for (const value of Object.values(body)) {
    if (!value || typeof value !== "object") continue;
    if (value.contextInfo) return value.contextInfo;
    if (value.message?.contextInfo) return value.message.contextInfo;
  }
  return null;
}

function getMentionedJids(message) {
  const contextInfo = getContextInfo(message);
  return [...new Set((contextInfo?.mentionedJid || [])
    .map((jid) => String(jid || "").split(":")[0])
    .filter((jid) => jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid")))];
}

function senderIsAdmin(metadata, senderJid, client) {
  const sender = String(senderJid || "").split(":")[0];
  const bot = String(client?.user?.id || "").split(":")[0];
  if (sender && sender === bot) return true;
  if (sender && sender === metadata?.owner) return true;
  return Boolean(metadata?.participants?.some((participant) => {
    const id = String(participant?.id || "").split(":")[0];
    return id === sender && (participant.admin === "admin" || participant.admin === "superadmin");
  }));
}

function botIsAdmin(metadata, client) {
  const bot = String(client?.user?.id || "").split(":")[0];
  return Boolean(metadata?.participants?.some((participant) => {
    const id = String(participant?.id || "").split(":")[0];
    return id === bot && (participant.admin === "admin" || participant.admin === "superadmin");
  }));
}

async function enforce(client, message, chatJid, senderJid) {
  const isStatus = chatJid === "status@broadcast";
  const mentions = getMentionedJids(message);
  if (!mentions.length) return false;

  if (isStatus) {
    // Status posts cannot be deleted by a bot. Return handled so downstream
    // auto-like/auto-forward features do not act on a blocked status mention.
    const candidates = Array.isArray(message?.key?.participant)
      ? message.key.participant : [message?.key?.participant || senderJid];
    for (const participant of candidates) {
      const groupJid = String(participant || "");
      if (groupJid.endsWith("@g.us")) {
        const state = await getMentionState(groupJid);
        if (state.antiStatusMention === "on") {
          console.log(`[AntiStatusMention] blocked status mention from ${groupJid}`);
          return true;
        }
      }
    }
    return false;
  }

  if (!String(chatJid || "").endsWith("@g.us")) return false;
  const state = await getMentionState(chatJid);
  if (state.antiMention !== "on") return false;

  let metadata;
  try { metadata = await client.groupMetadata(chatJid); }
  catch (error) {
    console.error("[AntiMention] group metadata failed:", error.message || error);
    return false;
  }
  if (senderIsAdmin(metadata, senderJid, client)) return false;

  const key = message?.key;
  if (!key) return false;
  const canModerate = botIsAdmin(metadata, client);
  const label = String(senderJid || key.participant || "").split("@")[0];

  if (canModerate && (state.action === "delete" || state.action === "warn" || state.action === "remove")) {
    try { await client.sendMessage(chatJid, { delete: key }); }
    catch (error) { console.error("[AntiMention] delete failed:", error.message || error); }
  }

  if (state.action === "warn" || state.action === "remove") {
    await client.sendMessage(chatJid, {
      text: `🚫 @${label}, mentions are not allowed in this group.`,
      mentions: senderJid ? [senderJid] : []
    });
  }

  if (state.action === "remove" && canModerate) {
    try { await client.groupParticipantsUpdate(chatJid, [senderJid], "remove"); }
    catch (error) { console.error("[AntiMention] remove failed:", error.message || error); }
  }

  console.log(`[AntiMention] ${state.action} applied to ${senderJid} in ${chatJid}`);
  return true;
}

module.exports = {
  ACTIONS,
  enforce,
  getMentionState,
  getMentionedJids,
  shouldIgnoreStatusMention,
  updateMentionState
};
