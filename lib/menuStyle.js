const settings = require('../settings');

const isIosPlainMenu = settings.BOT_OS === 'ios';

function iosPlainMenu(lines) {
  return lines
    .join('\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[*_`~]/g, '')
    .replace(/\r/g, '')
    .trim();
}

module.exports = { isIosPlainMenu, iosPlainMenu };
