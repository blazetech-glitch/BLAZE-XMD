const fs = require('fs');
const path = require('path');
const { bmbtz } = require('../../devblaze/blazetz');

const PLUGINS_ROOT = path.resolve(__dirname, '..');
const MAX_CODE_BYTES = 512 * 1024;

function collectJavaScriptFiles(dir, result = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectJavaScriptFiles(fullPath, result);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            result.push(fullPath);
        }
    }
    return result;
}

function normalizePluginQuery(input) {
    return String(input || '')
        .trim()
        .replace(/^plugins[\\/]/i, '')
        .replace(/\\/g, '/')
        .replace(/\.js$/i, '');
}

function findPlugin(query) {
    const normalized = normalizePluginQuery(query);
    if (!normalized || normalized.includes('\0') || normalized.split('/').includes('..')) {
        return null;
    }

    const files = collectJavaScriptFiles(PLUGINS_ROOT);
    const relativeQuery = normalized.toLowerCase();
    const exact = files.find((file) => {
        const relative = path.relative(PLUGINS_ROOT, file).replace(/\\/g, '/').replace(/\.js$/i, '').toLowerCase();
        return relative === relativeQuery;
    });
    if (exact) return exact;

    const basenameMatches = files.filter((file) => path.basename(file, '.js').toLowerCase() === relativeQuery);
    return basenameMatches.length === 1 ? basenameMatches[0] : null;
}

function usage(prefixe) {
    return `╭───〔 PLUGIN CODE 〕───
│
│ Owner-only command.
│
│ ${prefixe}code plugin-name
│ ${prefixe}code General/ping
│
╰────────────────────`;
}

bmbtz({
    nomCom: 'code',
    alias: ['plugin-code', 'source'],
    categorie: 'Mods',
    reaction: '📄'
}, async (dest, client, commandeOptions) => {
    const {
        arg = [],
        repondre,
        superUser,
        prefixe = '.'
    } = commandeOptions;

    if (!superUser) {
        return repondre('🚫 This command is restricted to the bot owner.');
    }

    const query = arg.join(' ').trim();
    if (!query || query.toLowerCase() === 'help') {
        return repondre(usage(prefixe));
    }

    const pluginPath = findPlugin(query);
    if (!pluginPath) {
        return repondre(`❌ Plugin not found or ambiguous: *${query}*\n\nUse a unique name, for example: ${prefixe}code General/ping`);
    }

    try {
        const source = fs.readFileSync(pluginPath);
        if (source.length > MAX_CODE_BYTES) {
            return repondre('❌ This plugin is larger than the safe 512 KB delivery limit.');
        }

        const relativeName = path.relative(PLUGINS_ROOT, pluginPath).replace(/\\/g, '/');
        await client.sendMessage(dest, {
            document: source,
            fileName: path.basename(pluginPath),
            mimetype: 'text/javascript',
            caption: `📄 BLAZE XMD plugin source\n\n${relativeName}`
        });
    } catch (error) {
        console.error('[CODE] Failed to send plugin source:', error);
        return repondre(`❌ Could not read that plugin.\n\n${error?.message || 'Unknown error'}`);
    }
});
