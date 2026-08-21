const googleTTS = require('google-tts-api');
const {blazetz} = require("../../devblaze/blazetz");


blazetz( {
  nomCom : "dit",
 categorie : "Search",
  reaction : "👄" },
      async(dest,client, commandeOptions)=> {
 
const {ms,arg,repondre} = commandeOptions;
      if (!arg[0]) {repondre("Insert a word");return} ;
 const mots = arg.join(" ")

const url = googleTTS.getAudioUrl( mots, {
  lang: 'fr',
  slow: false,
  host: 'https://translate.google.com',
});
console.log(url); 
             client.sendMessage(dest, { audio: { url:url},mimetype:'audio/mp4' }, { quoted: ms,ptt: true });


        
}
) ;

blazetz( {
  nomCom : "itta",
 categorie : "Search",
  reaction : "👄" },
      async(dest,client, commandeOptions)=> {
 
const {ms,arg,repondre} = commandeOptions;
      if (!arg[0]) {repondre("Insert a word");return} ;
 const mots = arg.join(" ")

const url = googleTTS.getAudioUrl( mots, {
  lang: 'ja',
  slow: false,
  host: 'https://translate.google.com',
});
console.log(url); 
             client.sendMessage(dest, { audio: { url:url},mimetype:'audio/mp4' }, { quoted: ms,ptt: true });


        
}
) ;

blazetz( {
  nomCom : "say",
 categorie : "Search",
  reaction : "👄" },
      async(dest,client, commandeOptions)=> {
 
const {ms,arg,repondre} = commandeOptions;
      if (!arg[0]) {repondre("Insert a word");return} ;
 const mots = arg.join(" ")

const url = googleTTS.getAudioUrl( mots, {
  lang: 'en',
  slow: false,
  host: 'https://translate.google.com',
});
console.log(url); 
             client.sendMessage(dest, { audio: { url:url},mimetype:'audio/mp4' }, { quoted: ms,ptt: true });


        
}
) ;

  
