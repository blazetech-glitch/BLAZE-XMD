const { blazetz } = require("../../devblaze/blazetz");
const {
    prepareWAMessageMedia,
    generateWAMessageFromContent
} = require("@whiskeysockets/baileys");

const OWNER_NUMBER = "255627417402";
const DEFAULT_IMAGE_URL = "https://cdn.ornzora.eu.cc/a6a1e8f4-b83d-4694-9bba-0f22a58bfd4f-FIORA.jpg";
const DEFAULT_VIDEO_URL = "https://cdn.ornzora.eu.cc/ed7ebb66-9bf4-44b6-858a-b6b7405e53c5-FIORA.mp4";

blazetz(
    {
        nomCom: "mediatest",
        categorie: "Mods",
        reaction: "🎞️",
        alias: ["mt", "pairedmedia"]
    },
    async (dest, client, context) => {
        const {
            arg = [],
            ms,
            repondre,
            auteurMessage,
            isOwner = false
        } = context;

        const requesterNumber = String(auteurMessage || "")
            .split(":")[0]
            .split("@")[0]
            .replace(/\D/g, "");
        const ownerAllowed = isOwner || requesterNumber === OWNER_NUMBER;
        if (!ownerAllowed) {
            return repondre("❌ This command is only for the BLAZE XMD owner.");
        }

        const imageUrl = arg[0] || DEFAULT_IMAGE_URL;
        const videoUrl = arg[1] || DEFAULT_VIDEO_URL;
        if (!/^https?:\/\//i.test(imageUrl) || !/^https?:\/\//i.test(videoUrl)) {
            return repondre("❌ Usage: .mediatest <image-url> <video-url>");
        }

        const react = (emoji) => client.sendMessage(dest, {
            react: { text: emoji, key: ms?.key }
        }).catch(() => {});

        try {
            await react("⏳");
            await repondre("⏳ Preparing paired image and video...");

            const [image, video] = await Promise.all([
                prepareWAMessageMedia(
                    { image: { url: imageUrl } },
                    { upload: client.waUploadToServer }
                ),
                prepareWAMessageMedia(
                    { video: { url: videoUrl } },
                    { upload: client.waUploadToServer }
                )
            ]);

            const imageMessage = generateWAMessageFromContent(
                dest,
                {
                    imageMessage: {
                        ...image.imageMessage,
                        contextInfo: {
                            pairedMediaType: 5,
                            statusSourceType: 0
                        }
                    }
                },
                {}
            );

            await client.relayMessage(dest, imageMessage.message, {
                messageId: imageMessage.key.id
            });

            await client.relayMessage(
                dest,
                {
                    videoMessage: {
                        ...video.videoMessage,
                        contextInfo: {
                            pairedMediaType: 6,
                            statusSourceType: 0
                        }
                    },
                    messageContextInfo: {
                        messageAssociation: {
                            associationType: 12,
                            parentMessageKey: imageMessage.key
                        }
                    }
                },
                { messageId: `${imageMessage.key.id}-video` }
            );

            await react("✅");
            return repondre("✅ Paired image and video sent successfully.");
        } catch (error) {
            console.error("[MediaTest Error]", error);
            await react("❌");
            return repondre(`❌ Media test failed: ${error.message || "Unknown error"}`);
        }
    }
);
