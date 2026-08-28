const { blazetz } = require('../../devblaze/blazetz');

const lines = [
  'Are you a notification? Because seeing you just made my day better.',
  'I was going to send a clever line, but your vibe already won the conversation.',
  'Are you Wi-Fi? Because I am feeling a strong connection.',
  'You must be a good playlist, because I could keep coming back to your vibe.',
  'I am not a photographer, but I can already picture a great conversation.',
  'Your energy has better timing than my favorite song dropping at midnight.',
  'I had a smooth opener ready, then your smile made me forget the script.',
  'If good vibes were currency, you would be a whole bank.',
  'You seem like the plot twist that makes a good story better.',
  'No pressure—your personality already has a five-star introduction.'
];

function cleanName(value) {
  return String(value || '').replace(/[\\*_~`]/g, '').trim().slice(0, 32);
}

blazetz({
  nomCom: 'rizz',
  alias: ['rz'],
  desc: 'Send a playful and respectful rizz line.',
  categorie: 'Funny',
  reaction: '😎',
  author: 'ARNOLDT20'
}, async (dest, client, response) => {
  const { repondre, arg = [] } = response;
  const name = cleanName(arg.join(' '));
  const line = lines[Math.floor(Math.random() * lines.length)];
  return repondre(`😎 *BLAZE RIZZ*${name ? ` · ${name}` : ''}\n\n${line}\n\n_Keep it respectful • ARNOLDT20_`);
});
