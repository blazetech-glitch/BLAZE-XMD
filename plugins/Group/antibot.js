const { blazetz } = require('../../devblaze/blazetz');
const { atbajouterOuMettreAJourJid, atbmettreAJourAction, atbverifierEtatJid, atbrecupererActionJid } = require('../../lib/antibot');
const { sendGroupFeedbackSticker } = require('../../lib/groupFeedbackSticker');

blazetz({
    nomCom: 'antibot',
    categorie: 'Group',
    reaction: '🤖'
}, async (dest, client, commandeOptions) => {

    const { arg, repondre, superUser, verifAdmin, verifGroupe } = commandeOptions;

    if (!verifGroupe) {
        return repondre('🚫 *This command is for group use only.*');
    }

    if (!(verifAdmin || superUser)) {
        return repondre(
`╭───〔 ACCESS DENIED 〕───
│
│ Admin only command
│
╰──────────────`
        );
    }

    const sub = (arg[0] || '').toLowerCase();

    if (!sub) {
        const enabled = await atbverifierEtatJid(dest);
        const action = await atbrecupererActionJid(dest);
        return repondre(
`╭───〔 ANTIBOT 〕───
│
│ Status : ${enabled ? 'ON ✅' : 'OFF ❌'}
│ Action : ${action}
│
│ ▶ antibot on
│ ▶ antibot off
│ ▶ antibot action remove
│ ▶ antibot action warn
│
╰──────────────`
        );
    }

    if (sub === 'on' || sub === 'off') {
        await atbajouterOuMettreAJourJid(dest, sub === 'on' ? 'oui' : 'non');
        await repondre(
`╭───〔 SUCCESS 〕───
│
│ Feature : antibot
│ Status  : ${sub.toUpperCase()}
│
╰──────────────`
        );
        await sendGroupFeedbackSticker(client, dest, { kind: 'config', quoted: commandeOptions.ms });
        return;
    }

    if (sub === 'action') {
        const act = (arg[1] || '').toLowerCase();
        if (act !== 'remove' && act !== 'warn') {
            return repondre('Use: antibot action remove  |  antibot action warn');
        }
        await atbmettreAJourAction(dest, act === 'remove' ? 'remove' : 'warn');
        await repondre(`✅ Antibot action set to: ${act}`);
        await sendGroupFeedbackSticker(client, dest, { kind: 'config', quoted: commandeOptions.ms });
        return;
    }

    return repondre('Use: antibot on | antibot off | antibot action remove/warn');
});
