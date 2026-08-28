const { blazetz } = require('../../devblaze/blazetz');
const { sendGroupFeedbackSticker } = require('../../lib/groupFeedbackSticker');

/**
 * close / open
 *
 * Restricts (close) or allows (open) regular members from sending
 * messages in the group — Baileys' groupSettingUpdate 'announcement'
 * mode (only admins can post) vs 'not_announcement' (everyone can post).
 */
blazetz({
    nomCom: 'close',
    alias: ['groupclose'],
    categorie: 'Group',
    reaction: '🔒'
}, async (dest, client, commandeOptions) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = commandeOptions;

    if (!verifGroupe) {
        return repondre('🚫 *This command is for group use only.*');
    }
    if (!(verifAdmin || superUser)) {
        return repondre('Sorry, only group admins can use this command.');
    }

    try {
        await client.groupSettingUpdate(dest, 'announcement');
        await repondre('🔒 Group closed. Only admins can send messages now.');
        await sendGroupFeedbackSticker(client, dest, { kind: 'config', quoted: commandeOptions.ms });
        return;
    } catch (e) {
        return repondre('Failed to close group: ' + (e.message || e).toString().slice(0, 60));
    }
});

blazetz({
    nomCom: 'open',
    alias: ['groupopen'],
    categorie: 'Group',
    reaction: '🔓'
}, async (dest, client, commandeOptions) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = commandeOptions;

    if (!verifGroupe) {
        return repondre('🚫 *This command is for group use only.*');
    }
    if (!(verifAdmin || superUser)) {
        return repondre('Sorry, only group admins can use this command.');
    }

    try {
        await client.groupSettingUpdate(dest, 'not_announcement');
        await repondre('🔓 Group opened. Everyone can send messages now.');
        await sendGroupFeedbackSticker(client, dest, { kind: 'config', quoted: commandeOptions.ms });
        return;
    } catch (e) {
        return repondre('Failed to open group: ' + (e.message || e).toString().slice(0, 60));
    }
});
