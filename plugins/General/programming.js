const { blazetz } = require('../../devblaze/blazetz');
const { MAX_SOURCE_LENGTH, analyzeSource, normalizeSource, renderStaticHtml } = require('../../lib/safeCodePreview');

function extractText(message) {
  const value = message?.conversation
    || message?.extendedTextMessage?.text
    || message?.imageMessage?.caption
    || message?.videoMessage?.caption
    || message?.documentMessage?.caption
    || '';
  return normalizeSource(value);
}

function sourceFrom(options) {
  const quoted = extractText(options.msgRepondu);
  const direct = Array.isArray(options.arg) ? options.arg.join(' ') : '';
  return quoted || normalizeSource(direct);
}

function reportFor(source) {
  const report = analyzeSource(source);
  return [
    '💻 *BLAZE CODE INSPECTOR*',
    '',
    `Language: *${report.language}*`,
    `Size: *${report.lines} line(s)* · *${report.characters} character(s)*`,
    `Structure: ${report.details.join('; ')}`,
    `Check: ${report.syntax}`,
    '',
    report.previewEligible
      ? 'Static HTML detected. The bot owner can reply with `.htmlpreview` to receive a restricted screenshot preview.'
      : 'This command analyzes code only. It does not execute JavaScript, Python, shell commands, files, network calls, or uploaded programs.'
  ].join('\n');
}

blazetz({
  nomCom: 'codecheck',
  alias: ['inspect', 'codeinspect', 'codeinfo'],
  desc: 'Detect and safely inspect replied JavaScript, Python, HTML, CSS, JSON, or text code.',
  categorie: 'Programming',
  author: 'ARNOLDT20',
  reaction: '💻'
}, async (dest, client, options) => {
  const source = sourceFrom(options);
  if (!source) return options.repondre('💻 Reply to a text/code message with `.codecheck` to detect and inspect it safely.');
  if (source.length > MAX_SOURCE_LENGTH) return options.repondre(`❌ The replied code is too large. Limit: ${MAX_SOURCE_LENGTH.toLocaleString()} characters.`);
  return options.repondre(reportFor(source));
});

blazetz({
  nomCom: 'htmlpreview',
  alias: ['htmlshot', 'previewhtml'],
  desc: 'Owner-only restricted screenshot preview for replied static HTML. Scripts, external resources, and forms are removed.',
  categorie: 'Programming',
  author: 'ARNOLDT20',
  reaction: '🖼️'
}, async (dest, client, options) => {
  const source = sourceFrom(options);
  if (!options.superUser) return options.repondre('🔒 HTML preview is restricted to the bot owner because it creates a local static screenshot.');
  if (!source) return options.repondre('🖼️ Reply to a static HTML message with `.htmlpreview`.');

  const report = analyzeSource(source);
  if (report.language !== 'HTML') return options.repondre('❌ Reply to static HTML code. Use `.codecheck` first to identify other code types.');

  try {
    await options.repondre('🖼️ Preparing a restricted static HTML screenshot…');
    const image = await renderStaticHtml(source);
    await client.sendMessage(dest, {
      image,
      caption: '🖼️ *STATIC HTML PREVIEW*\n\nScripts, forms, embeds, network resources, and file references were removed before rendering.'
    }, { quoted: options.ms });
  } catch (error) {
    await options.repondre(`❌ Static HTML preview failed: ${error.message || 'Unknown rendering error'}`);
  }
});
