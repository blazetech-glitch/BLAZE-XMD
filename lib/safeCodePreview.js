const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const MAX_SOURCE_LENGTH = 30_000;
const MAX_PREVIEW_LENGTH = 20_000;

function normalizeSource(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function detectLanguage(source) {
  const text = normalizeSource(source);
  if (/<!doctype\s+html|<html[\s>]|<body[\s>]|<head[\s>]/i.test(text)) return 'HTML';
  if (/^\s*<style[\s>]|^[^{]+\{[^}]*:[^}]*\}/m.test(text)) return 'CSS';
  if (/^\s*(def|class)\s+\w+|^\s*(from\s+\w+\s+import|import\s+\w+)|\bprint\s*\(/m.test(text)) return 'Python';
  if (/^\s*(const|let|var|function|class)\s+\w+|=>|module\.exports|require\s*\(|console\.(log|error)/m.test(text)) return 'JavaScript';
  if (/^\s*\{[\s\S]*\}\s*$/m.test(text)) {
    try {
      JSON.parse(text);
      return 'JSON';
    } catch (_) {}
  }
  if (/^\s*<\?php|\becho\s+\$/m.test(text)) return 'PHP';
  if (/^\s*package\s+\w+;|public\s+(class|static)|System\.out\.println/m.test(text)) return 'Java';
  return 'Plain text / unknown';
}

function bracketCheck(source) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  let quote = '';
  let escaped = false;

  for (const char of source) {
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') stack.push(char);
    else if (pairs[char] && stack.pop() !== pairs[char]) return 'Possible unmatched bracket detected.';
  }

  if (quote) return 'Possible unterminated quoted string detected.';
  return stack.length ? 'Possible unclosed bracket detected.' : 'Basic delimiter check passed.';
}

function analyzeSource(source) {
  const text = normalizeSource(source);
  const language = detectLanguage(text);
  const lines = text ? text.split('\n').length : 0;
  const count = (pattern) => (text.match(pattern) || []).length;
  const details = [];

  if (language === 'JavaScript') details.push(`${count(/\b(function|class)\b|=>/g)} function/class expression(s), ${count(/\b(import|require)\b/g)} import/require reference(s)`);
  if (language === 'Python') details.push(`${count(/^\s*(def|class)\s+/gm)} definition(s), ${count(/^\s*(from\s+\w+\s+import|import\s+\w+)/gm)} import line(s)`);
  if (language === 'HTML') details.push(`${count(/<\s*(section|div|main|header|footer|article)\b/gi)} layout element(s), ${count(/<\s*(img|video|audio|iframe)\b/gi)} media/embed element(s)`);
  if (language === 'CSS') details.push(`${count(/\{/g)} rule block(s), ${count(/#[0-9a-f]{3,8}|rgb\(|hsl\(/gi)} color declaration(s)`);
  if (language === 'JSON') details.push('Structured data detected; use it as configuration or an API payload, not executable code.');
  if (!details.length) details.push('No language-specific structure could be identified confidently.');

  return {
    language,
    lines,
    characters: text.length,
    details,
    syntax: bracketCheck(text),
    previewEligible: language === 'HTML'
  };
}

function sanitizeStaticHtml(source) {
  let clean = normalizeSource(source).slice(0, MAX_PREVIEW_LENGTH);
  clean = clean.replace(/<\/?(script|iframe|object|embed|applet|base|form|meta|link|video|audio|source|track)\b[^>]*>/gi, '');
  clean = clean.replace(/<\/(script|iframe|object|embed|applet|form|video|audio)\s*>/gi, '');
  clean = clean.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  clean = clean.replace(/\s(?:src|href|action|poster|data)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  clean = clean.replace(/@import\s+[^;]+;/gi, '');
  clean = clean.replace(/url\s*\([^)]*\)/gi, '');

  const csp = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; script-src 'none'; connect-src 'none'; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
  const shell = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>html,body{margin:0;padding:0;min-height:100%;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif}body{padding:24px;box-sizing:border-box}</style></head><body>${clean}</body></html>`;
  return shell;
}

async function renderStaticHtml(source) {
  const text = normalizeSource(source);
  if (!text || text.length > MAX_PREVIEW_LENGTH) throw new Error(`Static HTML preview is limited to ${MAX_PREVIEW_LENGTH.toLocaleString()} characters.`);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'blaze-static-preview-'));
  const htmlPath = path.join(directory, 'preview.html');
  const imagePath = path.join(directory, `${crypto.randomBytes(8).toString('hex')}.png`);
  const profilePath = path.join(directory, 'browser-profile');

  try {
    await fs.writeFile(htmlPath, sanitizeStaticHtml(text), 'utf8');
    await execFileAsync('/usr/bin/chromium', [
      '--headless=new',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--no-first-run',
      '--no-pings',
      '--mute-audio',
      '--window-size=1280,720',
      '--virtual-time-budget=500',
      `--user-data-dir=${profilePath}`,
      `--screenshot=${imagePath}`,
      `file://${htmlPath}`
    ], { timeout: 15_000, maxBuffer: 512 * 1024 });
    return await fs.readFile(imagePath);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

module.exports = {
  MAX_SOURCE_LENGTH,
  analyzeSource,
  detectLanguage,
  normalizeSource,
  renderStaticHtml
};
