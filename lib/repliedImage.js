function findRepliedImage(options = {}) {
  const queue = [options.msgRepondu, options.quoted, options.ms];
  const visited = new Set();
  let protectedMedia = false;

  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== 'object' || visited.has(node)) continue;
    visited.add(node);

    const viewOnce = node.viewOnceMessage?.message
      || node.viewOnceMessageV2?.message
      || node.viewOnceMessageV2Extension?.message;
    if (viewOnce) {
      protectedMedia = true;
      queue.push(viewOnce);
      continue;
    }

    if (node.imageMessage) return { image: node.imageMessage, protected: protectedMedia };
    if (node.message) queue.push(node.message);
    if (node.ephemeralMessage?.message) queue.push(node.ephemeralMessage.message);
    if (node.documentWithCaptionMessage?.message) queue.push(node.documentWithCaptionMessage.message);
    if (node.extendedTextMessage?.contextInfo?.quotedMessage) queue.push(node.extendedTextMessage.contextInfo.quotedMessage);
    if (node.contextInfo?.quotedMessage) queue.push(node.contextInfo.quotedMessage);
  }

  return { image: null, protected: protectedMedia };
}

module.exports = { findRepliedImage };
