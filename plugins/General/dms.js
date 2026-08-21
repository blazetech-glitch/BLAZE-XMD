const { bmbtz } = require('../../devblaze/blazetz');

const DURATIONS = new Map([
    ['off', 0],
    ['disable', 0],
    ['disabled', 0],
    ['0', 0],
    ['24h', 24 * 60 * 60],
    ['24hr', 24 * 60 * 60],
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
│ Set messages to disappear automatically.
│
│ ${prefixe}dms 24h
│ ${prefixe}dms 7d
│ ${prefixe}dms 90d
│ ${prefixe}dms off
│
╰────────────────────────`;
}

bmbtz({
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

    if (dest === 'status@broadcast') {
        return repondre('🚫 This command cannot be used in status broadcasts.');
    }

    if (verifGroupe && !(verifAdmin || superUser)) {
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
        if (seconds === 0) {
            return repondre('✅ Disappearing messages are now *OFF* in this chat.');
        }
        return repondre(`✅ Disappearing messages enabled for *${label}*.\n\nNew messages in this chat will expire automatically.`);
    } catch (error) {
        console.error('[DMS] Failed to update chat setting:', error);
        return repondre(`❌ Could not update disappearing messages.\n\n${error?.message || 'The chat setting was rejected.'}`);
    }
});
