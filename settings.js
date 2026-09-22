/** BLAZE XMD identity, environment loading, and default runtime settings. */
const fs = require('fs-extra');
const path = require('path');
const localSettingsPath = path.join(__dirname, 'settings.env');
if (fs.existsSync(localSettingsPath)) {
    require('dotenv').config({ path: localSettingsPath, override: true });
}
let appConfig = {};
try {
    appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
} catch (_) {
    appConfig = {};
}
const configuredBotOs = process.env.BOT_OS
    || process.env.MENU_OS
    || process.env.OS
    || appConfig.env?.BOT_OS?.value
    || 'android';
module.exports = {
    session: process.env.SESSION_ID || '',
    PREFIXE: process.env.PREFIX || ".",
    OWNER_NAME: process.env.OWNER_NAME || "BLAZE XMD",
    NUMERO_OWNER: process.env.NUMERO_OWNER || "",
    BOT: process.env.BOT_NAME || 'BLAZE XMD',
    URL: process.env.BOT_MENU_LINKS || 'https://blaze-xmd.zone.id',
    WELCOME_MEDIA_URL: process.env.WELCOME_MEDIA_URL || '',
    BOT_OS: String(configuredBotOs).toLowerCase() === 'ios' ? 'ios' : 'android',

    // Database-backed toggles use these values on a fresh installation.
    ANTICALL: process.env.ANTICALL || 'on',
    ANTIDELETE: process.env.ANTIDELETE || 'off',
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || 'on',
    AUTO_DOWNLOAD_STATUS: process.env.AUTO_DOWNLOAD_STATUS || 'off',
    AUTO_REACT_STATUS: process.env.AUTO_REACT_STATUS || 'on',
    AUTO_READ: process.env.AUTO_READ || 'off',
    MODE: process.env.PUBLIC_MODE || 'on',
    PM_PERMIT: process.env.PM_PERMIT || 'off',
    WARN_COUNT: process.env.WARN_COUNT || '3',
    ETAT: process.env.PRESENCE || '',
};

// Reload this module when the file changes during development.
let fichier = require.resolve(__filename);
fs.watchFile(fichier, () => {
    fs.unwatchFile(fichier);
    console.log(`mise à jour ${__filename}`);
    delete require.cache[fichier];
    require(fichier);
});
