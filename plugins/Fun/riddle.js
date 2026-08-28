const { blazetz } = require('../../devblaze/blazetz');

const riddles = [
  { question: 'What has keys but cannot open locks?', answer: 'A piano.' },
  { question: 'What gets wetter the more it dries?', answer: 'A towel.' },
  { question: 'What has a face and two hands but no arms or legs?', answer: 'A clock.' },
  { question: 'What can travel around the world while staying in one corner?', answer: 'A stamp.' },
  { question: 'What has many teeth but cannot bite?', answer: 'A comb.' },
  { question: 'What goes up but never comes down?', answer: 'Your age.' },
  { question: 'What has one eye but cannot see?', answer: 'A needle.' },
  { question: 'What belongs to you, but other people use it more than you do?', answer: 'Your name.' },
  { question: 'What has words but never speaks?', answer: 'A book.' },
  { question: 'What can you catch but never throw?', answer: 'A cold.' }
];

blazetz({
  nomCom: 'riddle',
  alias: ['rdl'],
  desc: 'Send a quick riddle with its answer.',
  categorie: 'Funny',
  reaction: '🧩',
  author: 'ARNOLDT20'
}, async (dest, client, response) => {
  const { repondre } = response;
  const riddle = riddles[Math.floor(Math.random() * riddles.length)];
  return repondre(`🧩 *RIDDLE TIME*\n\n${riddle.question}\n\n_Answer:_ ||${riddle.answer}||\n\n_BLAZE XMD • ARNOLDT20_`);
});
