
const { blazetz } = require('../../devblaze/blazetz');
const {ajouterUtilisateurAvecWarnCount , getWarnCountByJID , resettingsWarnCountByJID} = require('../../lib/warn')
const s = require("../../settings")
const { sendGroupFeedbackSticker } = require('../../lib/groupFeedbackSticker');


blazetz(
    {
        nomCom : 'warn',
        categorie : 'Group'
        
    },async (dest,client,commandeOptions) => {

 const {ms , arg, repondre,superUser,verifGroupe,verifAdmin , msgRepondu , auteurMsgRepondu} = commandeOptions;
if(!verifGroupe ) {repondre('this is a group commands') ; return};

if(verifAdmin || superUser) {
   if(!msgRepondu){repondre('reply a message of user to warn'); return};
   
   if (!arg || !arg[0] || arg.join('') === '') {
    await ajouterUtilisateurAvecWarnCount(auteurMsgRepondu)
   let warn = await getWarnCountByJID(auteurMsgRepondu)
   let warnlimit = s.WARN_COUNT
   
   if( warn >= warnlimit ) { await client.groupParticipantsUpdate(dest, [auteurMsgRepondu], "remove")
                await repondre('this user reach limit of warning , so i kick him/her');
                await sendGroupFeedbackSticker(client, dest, { kind: 'member', quoted: ms });
 } else { 

    var rest = warnlimit - warn ;
     await repondre(`this user is warn , rest before kick : ${rest} `);
     await sendGroupFeedbackSticker(client, dest, { kind: 'warning', quoted: ms });
   }
} else if ( arg[0] === 'resettings') { await resettingsWarnCountByJID(auteurMsgRepondu) 

    await repondre("Warn count is resettings for this user");
    await sendGroupFeedbackSticker(client, dest, { kind: 'config', quoted: ms });
 } else ( repondre('reply to a user by typing  .warn ou .warn resettings'))
   
}  else {
    repondre('you are not admin')
}
 
   });
