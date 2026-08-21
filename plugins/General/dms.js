const { blazetz } = require('../../devblaze/blazetz');

const DURATIONS = new Map([
    ['off', 0],
    ['disable', 0],
    ['disabled', 0],
    ['0', 0],
    ['24h', 24 * 60 * 60],
    ['24hr', 24 * 60 * 60],
    ['24 hours', 24 * 60 * 60],
    ['24hours', 24 * 60 * 60],
    ['1d', 24 * 60 * 60],
    ['1day', 24 * 60 * 60],
    ['1 day', 24 * 60 * 60],
    ['7d', 7 * 24 * 60 * 60],
    ['7day', 7 * 24 * 60 * 60],
    ['7 days', 7 * 24 * 60 * 60],
    ['90d', 90 * 24 * 60 * 60],
    ['90day', 90 * 24 * 60 * 60],
    ['90 days', 90 * 24 * 60 * 60],
]);

const LABELS = new Map([
    [0, 'OFF'],
    [24 * 60 * 60, '24 hours'],
    [7 * 24 * 60 * 60, '7 days'],
    [90 * 24 * 60 * 60, '90 days'],
]);

function usage(prefixe) {
    return `╭───〔 DISAPPEARING MESSAGES 〕───
│
│ Changes this chat's actual WhatsApp setting.
│
│ ${prefixe}dms 24h   (24 hours)
│ ${prefixe}dms 7d    (7 days)
│ ${prefixe}dms 90d   (90 days)
│ ${prefixe}dms off
│
╰────────────────────────`;
}

blazetz({
    nomCom: 'dms',
    alias: ['disappear', 'disappearing'],
    categorie: 'General',
    reaction: '⏳'
}, async (dest, client, commandeOptions) => {
    const {
        arg = [],
        repondre,
        verifGroupe,
        verifAdmin,
        superUser,
        prefixe = '.'
    } = commandeOptions;

    const chatJid = String(dest || '');
    const isGroupChat = chatJid.endsWith('@g.us') || verifGroupe === true;
    const isPrivateChat = chatJid.endsWith('@s.whatsapp.net') || (!isGroupChat && chatJid !== 'status@broadcast');

    if (dest === 'status@broadcast') {
        return repondre('🚫 This command cannot be used in status broadcasts.');
    }

    if (isGroupChat && !(verifAdmin || superUser)) {
        return repondre('🚫 Only group admins or the bot owner can change disappearing-message settings in a group.');
    }

    const option = arg.join(' ').trim().toLowerCase();
    if (!option || option === 'help') {
        return repondre(usage(prefixe));
    }

    const seconds = DURATIONS.get(option);
    if (seconds === undefined) {
        return repondre(
            `❌ Unsupported duration: *${option}*\n\n` +
            'Use one of: *24h*, *7d*, *90d*, or *off*.'
        );
    }

    try {
        await client.sendMessage(dest, { disappearingMessagesInChat: seconds });
        const label = LABELS.get(seconds);
        const chatType = isPrivateChat ? 'private chat' : 'chat';
        if (seconds === 0) {
            return repondre(`✅ Disappearing messages are now *OFF* in this ${chatType}.`);
        }
        return repondre(`✅ This ${chatType} is now set to *${label}* disappearing messages.\n\nWhatsApp will apply the setting to new messages in this chat.`);
    } catch (error) {
        console.error('[DMS] Failed to update chat setting:', error);
        return repondre(`❌ Could not update disappearing messages.\n\n${error?.message || 'The chat setting was rejected.'}`);
    }
});
