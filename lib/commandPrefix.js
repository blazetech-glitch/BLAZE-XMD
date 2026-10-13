"use strict";

/**
 * Parse a command using a configured prefix.
 *
 * WhatsApp can normalize emoji presentation selectors differently between
 * clients. We first try an exact NFC match, then a presentation-insensitive
 * match while consuming the exact number of source characters that formed the
 * configured prefix. This keeps ordinary prefixes (`.`, `!`, `blaze`) fast
 * and makes emoji prefixes reliable without changing command names.
 */
function parseCommandPrefix(text, configuredPrefix) {
  const body = String(text ?? "");
  const prefix = String(configuredPrefix ?? "").normalize("NFC");
  if (!prefix || /\s/u.test(prefix)) return null;

  const foldedPrefix = foldEmojiPresentation(prefix);
  const foldedBody = foldEmojiPresentation(body);
  if (!foldedPrefix || !foldedBody.startsWith(foldedPrefix)) return null;

  let sourceEnd = 0;
  for (const character of Array.from(body)) {
    sourceEnd += character.length;
    if (foldEmojiPresentation(body.slice(0, sourceEnd)) === foldedPrefix) {
      return commandFromRemainder(body.slice(sourceEnd), body.slice(0, sourceEnd));
    }
    if (foldEmojiPresentation(body.slice(0, sourceEnd)).length > foldedPrefix.length) break;
  }

  // Defensive fallback for unusual Unicode normalization forms.
  if (body.startsWith(prefix)) {
    return commandFromRemainder(body.slice(prefix.length), prefix);
  }
  return null;
}

function commandFromRemainder(remainder, matchedPrefix) {
  const commandText = String(remainder).trimStart();
  const command = commandText.split(/\s+/u)[0]?.toLowerCase() || "";
  return { prefix: matchedPrefix, command, commandText };
}

function foldEmojiPresentation(value) {
  return String(value)
    .normalize("NFC")
    .replace(/[\uFE0E\uFE0F]/gu, "")
    .replace(/\u200D/gu, "");
}

module.exports = { parseCommandPrefix, foldEmojiPresentation };
