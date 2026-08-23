const { blazetz } = require('../../devblaze/blazetz');
const { setTimedMute, clearTimedMute, getTimedMutes } = require('../../lib/groupModeration');

function cleanJid(value) {
  if (!value) return '';
  return String(value).trim().replace(/^@/, '');
}

function identities(jid) {
  const raw = cleanJid(jid);
  const base = raw.split(':')[0];
  const number = base.split('@')[0].replace(/\D/g, '');
  return new Set([raw, base, number].filter(Boolean));
}

function sameUser(a, b) {
  const left = identities(a);
  return [...identities(b)].some((value) => left.has(value));
}

function resolveTarget(options) {
  const mentioned = Array.isArray(options.mentionedJid) ? options.mentionedJid.find(Boolean) : '';
  return cleanJid(mentioned || options.auteurMsgRepondu || '');
}

function parseDuration(value) {
  const match = String(value || '').trim().toLowerCase().match(/^(\d{1,5})(s|m|h|d)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  const duration = amount * multipliers[match[2]];
  if (!Number.isSafeInteger(duration) || duration < 10_000 || duration > 7 * 24 * 60 * 60 * 1000) return null;
  return duration;
}

function formatDuration(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes >= 1440) return `${Math.round(minutes / 1440)}d`;
  if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
  return `${Math.max(1, minutes)}m`;
}

function displayUser(jid) {
  return `@${String(jid).split('@')[0].split(':')[0]}`;
}

function canManage(options) {
  return Boolean(options.verifAdmin || options.superUser);
}

function privateMuteNotice(groupName, duration, until) {
  return `🔇 *BLAZE XMD — PRIVATE NOTICE*\n\nYou have been muted in *${groupName || 'this group'}*.\n\n⏱️ Duration: *${formatDuration(duration)}*\n🕒 Expires: *${new Date(until).toLocaleString()}*\n\nText messages sent during this period may be removed automatically.\n\nIf you believe this was a mistake, contact a group admin.\n\n_© BLAZE XMD • ARNOLDT20_`;
}

async function muteCommand(dest, client, options) {
  const { repondre, verifGroupe, arg = [], idBot, mbre = [] } = options;
  if (!verifGroupe) return repondre('❌ This command is for groups only.');
  if (!canManage(options)) return repondre('❌ Only group admins or the bot owner can mute users.');
  if (!options.verifBlazetzAdmin && !options.superUser) return repondre('❌ BLAZE XMD must be a group admin to delete muted messages.');

  const target = resolveTarget(options);
  const duration = parseDuration(arg.find((item) => /\d+[smhd]$/i.test(item)));
  if (!target || !duration) {
    return repondre('🔇 *MUTE USER*\n\nReply to a user or mention them, then use `.mute 10m`.\nAllowed duration: `10s`, `10m`, `2h`, or `1d` (maximum 7d).');
  }
  if (sameUser(target, idBot)) return repondre('❌ The bot cannot mute itself.');

  const member = mbre.find((item) => [item.id, item.jid, item.lid, item.phoneNumber, item.phone_number, item.pn].some((value) => sameUser(value, target)));
  if (member?.admin) return repondre('❌ Admins cannot be muted by this command.');

  const until = Date.now() + duration;
  await setTimedMute(dest, target, until, options.auteurMessage);
  let privateNoticeSent = true;
  try {
    await client.sendMessage(target, { text: privateMuteNotice(options.nomGroupe, duration, until) });
  } catch (error) {
    privateNoticeSent = false;
    console.warn('[Mute] private notification failed:', error.message || error);
  }
  const noticeState = privateNoticeSent
    ? 'A private notice was sent to the user.'
    : 'The mute is active, but WhatsApp did not deliver the private notice.';
  return repondre(`🔇 *USER MUTED*\n\n${displayUser(target)} is muted for *${formatDuration(duration)}*.\nTheir text messages will be removed until ${new Date(until).toLocaleString()}.\n\n${noticeState}`);
}

async function unmuteCommand(dest, client, options) {
  const { repondre, verifGroupe, idBot } = options;
  if (!verifGroupe) return repondre('❌ This command is for groups only.');
  if (!canManage(options)) return repondre('❌ Only group admins or the bot owner can unmute users.');
  const target = resolveTarget(options);
  if (!target || sameUser(target, idBot)) return repondre('❌ Mention the user or reply to their message, then use `.unmute`.');
  const removed = await clearTimedMute(dest, target);
  return repondre(removed ? `✅ ${displayUser(target)} has been unmuted.` : 'ℹ️ That user is not currently muted.');
}

async function listMutes(dest, client, options) {
  const { repondre, verifGroupe } = options;
  if (!verifGroupe) return repondre('❌ This command is for groups only.');
  const mutes = await getTimedMutes(dest);
  if (!mutes.length) return repondre('✅ No users are currently muted.');
  const lines = mutes.map((mute, index) => `${index + 1}. ${displayUser(mute.jid)} — until ${new Date(mute.until).toLocaleString()}`);
  return repondre(`🔇 *ACTIVE MUTES*\n\n${lines.join('\n')}`);
}

blazetz({
  nomCom: 'mute',
  alias: ['muteuser'],
  desc: 'Mute a group user for a duration and remove their text messages.',
  categorie: 'Group',
  author: 'ARNOLDT20',
  reaction: '🔇'
}, muteCommand);

blazetz({
  nomCom: 'unmute',
  alias: ['unmuteuser'],
  desc: 'Remove a timed group mute.',
  categorie: 'Group',
  author: 'ARNOLDT20',
  reaction: '🔊'
}, unmuteCommand);

blazetz({
  nomCom: 'muted',
  alias: ['mutes'],
  desc: 'List currently muted group users.',
  categorie: 'Group',
  author: 'ARNOLDT20',
  reaction: '📋'
}, listMutes);
