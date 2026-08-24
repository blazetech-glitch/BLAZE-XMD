"use strict";
/**
 * eventHandler.js
 *
 * Handles group-participants.update events: welcome, goodbye,
 * anti-promote, and anti-demote. Moved here out of index.js (which
 * previously had this logic inline) so index.js only wires up the
 * event listener and delegates the actual work here — matching how
 * BLAZE-XMD splits this into handlers/eventHandler.js's groupEvents()
 * function, called from its index.js the same way.
 *
 * This is a structural move only — the behavior (custom text support,
 * fallback profile picture, mention formatting, super-user bypass for
 * anti-promote/anti-demote) is unchanged from what index.js did before.
 */
const { recupevents } = require('../lib/welcome');
const conf = require('../settings');

/**
 * @param {import('@whiskeysockets/baileys').WASocket} client
 * @param {{ id: string, participants: string[], action: string, author?: string }} group
 */
function normalizeParticipant(participant) {
    if (typeof participant === 'string') return participant;
    if (!participant || typeof participant !== 'object') return null;
    return participant.phoneNumber || participant.id || participant.jid || null;
}

function mentionLabel(jid) {
    return String(jid || '').split('@')[0].split(':')[0];
}

async function sendGreeting(client, groupId, participantJid, caption) {
    const fallbackImage = 'https://files.catbox.moe/f9jxiv.jpg';
    const configuredImage = typeof conf.WELCOME_MEDIA_URL === 'string' && /^https?:\/\//i.test(conf.WELCOME_MEDIA_URL)
        ? conf.WELCOME_MEDIA_URL
        : '';
    let profileImage = configuredImage || fallbackImage;

    if (!configuredImage) {
        try {
            const profileResult = await client.profilePictureUrl(participantJid, 'image');
            if (typeof profileResult === 'string' && /^https?:\/\//i.test(profileResult)) {
                profileImage = profileResult;
            }
        } catch (_) {
            // Keep the stable fallback image.
        }
    }

    try {
        await client.sendMessage(groupId, {
            image: { url: profileImage },
            caption,
            mentions: [participantJid]
        });
    } catch (mediaError) {
        console.warn('[Group greeting] Image send failed; sending text fallback:', mediaError.message);
        await client.sendMessage(groupId, {
            text: caption,
            mentions: [participantJid]
        });
    }
}

async function groupEvents(client, group) {
    console.log('Group participants update triggered:', group);

    try {
        const metadata = await client.groupMetadata(group.id);
        const membres = (Array.isArray(group.participants) ? group.participants : [])
            .map(normalizeParticipant)
            .filter(Boolean);
        if (!membres.length) {
            console.warn('[Group greeting] No usable participant JID was supplied.');
            return;
        }
        const member = membres[0];
        const groupName = metadata.subject || "Group";
        const groupDesc = metadata.desc || "no group information";

        // date and time
        const now = new Date();
        const date = now.toLocaleDateString('en-GB');
        const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        // 🟢 WELCOME
        if (group.action === 'add' && (await recupevents(group.id, "welcome")) === 'on') {
            const customWelcome = await recupevents(group.id, "welcometext");
            let msg;
            if (customWelcome && customWelcome !== 'non') {
                msg = customWelcome
                    .replace(/{user}/g, `@${mentionLabel(member)}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{desc}/g, groupDesc)
                    .replace(/{date}/g, date)
                    .replace(/{time}/g, time)
                    .replace(/{count}/g, String(metadata.participants?.length || ''));
            } else {
                msg = `✦ *BLAZE XMD* ✦

Welcome, @${mentionLabel(member)}
*${groupName}*

Glad to have you here.`;
            }

            await sendGreeting(client, group.id, member, msg);

            console.log('✅ Welcome message sent.');
        }

        // 🔴 GOODBYE
        else if (group.action === 'remove' && (await recupevents(group.id, "goodbye")) === 'on') {
            const customGoodbye = await recupevents(group.id, "goodbyetext");
            let msg;
            if (customGoodbye && customGoodbye !== 'non') {
                msg = customGoodbye
                    .replace(/{user}/g, `@${mentionLabel(member)}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{desc}/g, groupDesc)
                    .replace(/{date}/g, date)
                    .replace(/{time}/g, time)
                    .replace(/{count}/g, String(metadata.participants?.length || ''));
            } else {
                msg = `✦ *BLAZE XMD* ✦

Goodbye, @${mentionLabel(member)}
You will be missed in *${groupName}*.`;
            }

            await sendGreeting(client, group.id, member, msg);

            console.log('✅ Goodbye message sent.');
        }

        // 🛑 ANTI-PROMOTE
        else if (group.action === 'promote' && (await recupevents(group.id, "antipromote")) === 'on') {
            if (
                group.author === metadata.owner ||
                group.author === client.user.id ||
                group.author === group.participants[0]
            ) {
                console.log('SuperUser detected, no action taken.');
                return;
            }

            await client.groupParticipantsUpdate(group.id, [group.author, group.participants[0]], "demote");

            await client.sendMessage(group.id, {
                text: `🚫 @${group.author.split("@")[0]} has violated the anti-promotion rule. Both @${group.author.split("@")[0]} and @${group.participants[0].split("@")[0]} have been removed from administrative rights.`,
                mentions: [group.author, group.participants[0]]
            });

            console.log('❌ Anti-promotion action executed.');
        }

        // 🟡 ANTI-DEMOTE
        else if (group.action === 'demote' && (await recupevents(group.id, "antidemote")) === 'on') {
            if (
                group.author === metadata.owner ||
                group.author === client.user.id ||
                group.author === group.participants[0]
            ) {
                console.log('SuperUser detected, no action taken.');
                return;
            }

            await client.groupParticipantsUpdate(group.id, [group.author], "demote");
            await client.groupParticipantsUpdate(group.id, [group.participants[0]], "promote");

            await client.sendMessage(group.id, {
                text: `🚫 @${group.author.split("@")[0]} has violated the anti-demotion rule by removing @${group.participants[0].split("@")[0]}. Consequently, he has been stripped of administrative rights.`,
                mentions: [group.author, group.participants[0]]
            });

            console.log('❌ Anti-demotion action executed.');
        }

    } catch (e) {
        console.error('❌ Error handling group participants update:', e);
    }
}

module.exports = { groupEvents };
