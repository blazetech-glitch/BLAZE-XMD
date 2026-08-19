const crypto = require("crypto");
const { PassThrough } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const { bmbtz } = require("../../devblaze/blazetz");
const {
    generateWAMessageContent,
    generateWAMessageFromContent,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const PURPLE_COLOR = "#9C27B0";

try {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
} catch (error) {
    console.warn("[GroupStatus] ffmpeg binary setup warning:", error.message);
}

bmbtz(
    {
        nomCom: "groupstatus",
        categorie: "Group",
        reaction: "📣",
        alias: ["gcstatus", "gstatus"]
    },
    async (dest, client, context) => {
        const {
            arg = [],
            repondre,
            ms,
            verifGroupe,
            verifAdmin,
            verifBmbtzAdmin
        } = context;

        if (!verifGroupe) {
            return repondre("👥 This command can only be used inside a group.");
        }
        if (!verifAdmin) {
            return repondre("❌ Only group admins can post a group status.");
        }
        if (!verifBmbtzAdmin) {
            return repondre("❌ Please make BLAZE XMD an admin before posting a group status.");
        }

        const caption = arg.join(" ").trim();
        const quotedMessage = ms?.message?.extendedTextMessage?.contextInfo?.quotedMessage
            || ms?.message?.imageMessage?.contextInfo?.quotedMessage
            || ms?.message?.videoMessage?.contextInfo?.quotedMessage;

        if (!quotedMessage) {
            if (!caption) {
                return repondre(
                    "📝 *Group Status Usage*\n\n" +
                    "• Reply to an image, video, audio, or sticker:\n" +
                    "  `.groupstatus [optional caption]`\n\n" +
                    "• Post a text status:\n" +
                    "  `.groupstatus Your text here`"
                );
            }

            await repondre("⏳ Posting text group status...");
            try {
                await postGroupStatus(client, dest, {
                    text: caption,
                    backgroundColor: PURPLE_COLOR
                });
                return repondre("✅ Text group status posted successfully.");
            } catch (error) {
                console.error("[GroupStatus] text error:", error);
                return repondre(`❌ Failed to post text group status: ${error.message || error}`);
            }
        }

        const mediaType = detectMediaType(quotedMessage);
        if (!mediaType) {
            return repondre("❌ Unsupported quoted media. Reply to an image, video, audio, or sticker.");
        }

        await repondre(`⏳ Preparing ${mediaType} group status...`);

        try {
            const buffer = await downloadMedia(quotedMessage, mediaType);
            if (!buffer?.length) throw new Error("The quoted media could not be downloaded.");

            if (mediaType === "audio") {
                const voiceNote = await convertToVoiceNote(buffer);
                const waveform = await generateWaveform(buffer).catch(() => undefined);
                await postGroupStatus(client, dest, {
                    audio: voiceNote,
                    mimetype: "audio/ogg; codecs=opus",
                    ptt: true,
                    waveform
                });
            } else if (mediaType === "sticker") {
                await postGroupStatus(client, dest, {
                    sticker: buffer
                });
            } else {
                await postGroupStatus(client, dest, {
                    [mediaType]: buffer,
                    caption
                });
            }

            return repondre(`✅ ${mediaType[0].toUpperCase() + mediaType.slice(1)} group status posted successfully.`);
        } catch (error) {
            console.error(`[GroupStatus] ${mediaType} error:`, error);
            return repondre(`❌ Failed to post ${mediaType} group status: ${error.message || error}`);
        }
    }
);

function detectMediaType(message) {
    if (!message || typeof message !== "object") return null;
    if (message.imageMessage) return "image";
    if (message.videoMessage) return "video";
    if (message.audioMessage) return "audio";
    if (message.stickerMessage) return "sticker";
    return null;
}

async function downloadMedia(message, type) {
    const mediaMessage = message[`${type}Message`];
    if (!mediaMessage) throw new Error(`Missing ${type} message payload.`);

    const stream = await downloadContentFromMessage(mediaMessage, type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function postGroupStatus(client, jid, content) {
    const backgroundColor = content.backgroundColor || PURPLE_COLOR;
    const messageContent = { ...content };
    delete messageContent.backgroundColor;

    const innerMessage = await generateWAMessageContent(messageContent, {
        upload: client.waUploadToServer,
        backgroundColor
    });

    const secret = crypto.randomBytes(32);
    const generated = generateWAMessageFromContent(
        jid,
        {
            messageContextInfo: { messageSecret: secret },
            groupStatusMessageV2: {
                message: {
                    ...innerMessage,
                    messageContextInfo: { messageSecret: secret }
                }
            }
        },
        {}
    );

    await client.relayMessage(jid, generated.message, {
        messageId: generated.key.id
    });
    return generated;
}

function convertToVoiceNote(buffer) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        const output = new PassThrough();
        const chunks = [];
        input.end(buffer);

        output.on("data", (chunk) => chunks.push(chunk));
        ffmpeg(input)
            .noVideo()
            .audioCodec("libopus")
            .format("ogg")
            .audioChannels(1)
            .audioFrequency(48000)
            .on("error", reject)
            .on("end", () => resolve(Buffer.concat(chunks)))
            .pipe(output);
    });
}

function generateWaveform(buffer, bars = 64) {
    return new Promise((resolve, reject) => {
        const input = new PassThrough();
        const chunks = [];
        input.end(buffer);

        ffmpeg(input)
            .audioChannels(1)
            .audioFrequency(16000)
            .format("s16le")
            .on("error", reject)
            .on("end", () => {
                const raw = Buffer.concat(chunks);
                const samples = Math.floor(raw.length / 2);
                if (!samples) return resolve(undefined);

                const amplitudes = [];
                for (let i = 0; i < samples; i++) {
                    amplitudes.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
                }

                const size = Math.floor(amplitudes.length / bars);
                if (!size) return resolve(undefined);
                const averages = Array.from({ length: bars }, (_, index) => {
                    const slice = amplitudes.slice(index * size, (index + 1) * size);
                    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
                });
                const max = Math.max(...averages);
                if (!max) return resolve(undefined);

                resolve(Buffer.from(averages.map((value) => Math.floor((value / max) * 100))).toString("base64"));
            })
            .pipe()
            .on("data", (chunk) => chunks.push(chunk));
    });
}
