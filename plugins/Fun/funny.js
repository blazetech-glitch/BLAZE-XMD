const { blazetz } = require('../../devblaze/blazetz');
const { randomInt } = require('crypto');

const JOKES = [
  'Why did the keyboard break up with the mouse? It needed more space.',
  'I told my Wi-Fi a joke. Now it keeps dropping the connection.',
  'Why did the bot bring a ladder to the chat? The conversation was going up.',
  'My code said it needed a break, so I gave it a semicolon.',
  'Why do calendars look stressed? Their days are numbered.',
  'I asked the group chat for silence. It replied with twelve stickers.',
  'Why did the phone wear glasses? It lost its contacts.',
  'A bug walks into a bar. The bartender says: “Sorry, we do not serve your type.”'
];

const WOULD_YOU_RATHER = [
  'Would you rather have unlimited battery or unlimited mobile data?',
  'Would you rather always arrive five minutes early or twenty minutes late?',
  'Would you rather communicate only with stickers or only with voice notes?',
  'Would you rather be famous in every group chat or unknown but always correct?',
  'Would you rather have a pause button or a rewind button for life?',
  'Would you rather receive one perfect meme a day or write ten bad jokes a day?'
];

const FUN_FACTS = [
  'Octopuses have three hearts, but BLAZE XMD still only needs one prefix.',
  'Bananas are berries, while strawberries are not. Nature enjoys confusing menus.',
  'A day on Venus is longer than a year on Venus.',
  'Honey can remain edible for a very long time when stored well.',
  'Some turtles can breathe through specialized surfaces near their rear end. Biology has jokes too.',
  'The shortest war in recorded history lasted less than an hour.'
];

function pick(items) {
  return items[randomInt(items.length)];
}

blazetz({
  nomCom: 'joke',
  alias: ['funny', 'lol'],
  desc: 'Send a short clean joke.',
  categorie: 'Funny',
  author: 'ARNOLDT20',
  reaction: '😂'
}, async (dest, client, { repondre }) => {
  await repondre(`😂 *BLAZE JOKE*\n\n${pick(JOKES)}`);
});

blazetz({
  nomCom: 'wouldyou',
  alias: ['wyr', 'choose'],
  desc: 'Send a funny would-you-rather question.',
  categorie: 'Funny',
  author: 'ARNOLDT20',
  reaction: '🤔'
}, async (dest, client, { repondre }) => {
  await repondre(`🤔 *WOULD YOU RATHER?*\n\n${pick(WOULD_YOU_RATHER)}`);
});

blazetz({
  nomCom: 'funfact',
  alias: ['fact', 'randomfact'],
  desc: 'Send a light random fact.',
  categorie: 'Funny',
  author: 'ARNOLDT20',
  reaction: '🧠'
}, async (dest, client, { repondre }) => {
  await repondre(`🧠 *FUN FACT*\n\n${pick(FUN_FACTS)}`);
});

blazetz({
  nomCom: 'coinflip',
  alias: ['flip', 'coin'],
  desc: 'Flip a coin for a quick group decision.',
  categorie: 'Funny',
  author: 'ARNOLDT20',
  reaction: '🪙'
}, async (dest, client, { repondre }) => {
  const result = randomInt(2) ? 'HEADS' : 'TAILS';
  await repondre(`🪙 *COIN FLIP*\n\n${result}`);
});
