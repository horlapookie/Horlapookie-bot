import fs from "fs";
import axios from "axios";
import { tmpdir } from "os";
import path from "path";
import Crypto from "crypto";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { writeExifImg, writeExifVid } from '../lib/exif.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: "sticker",
  description: "Convert image/video to sticker",
  aliases: ["s"],
  async execute(msg, { sock, args }) {
    try {
      let mediaBuffer, type;
      let targetMessage = null;

      // Check if replying to a message
      if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;

        if (quotedMsg.imageMessage) {
          targetMessage = {
            key: {
              remoteJid: msg.key.remoteJid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextMessage.contextInfo.participant
            },
            message: quotedMsg
          };
          type = "image";
        } else if (quotedMsg.videoMessage) {
          targetMessage = {
            key: {
              remoteJid: msg.key.remoteJid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextMessage.contextInfo.participant
            },
            message: quotedMsg
          };
          type = "video";
        }
      }
      // Check current message
      else if (msg.message?.imageMessage) {
        targetMessage = msg;
        type = "image";
      } else if (msg.message?.videoMessage) {
        targetMessage = msg;
        type = "video";
      }
      // Check for URL
      else if (args[0]?.startsWith("http")) {
        const res = await axios.get(args[0], { responseType: "arraybuffer" });
        mediaBuffer = Buffer.from(res.data);
        type = args[0].includes(".mp4") || args[0].includes(".gif") ? "video" : "image";
      }

      if (!mediaBuffer && !targetMessage) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Please reply to an image/video or provide a media URL!\n\n📝 **Usage:**\n• Reply to image/video: ?sticker\n• With URL: ?sticker [url]\n• With custom pack: ?sticker PackName|AuthorName" },
          { quoted: msg }
        );
      }

      // Download media if we have a target message
      if (targetMessage && !mediaBuffer) {
        const stream = await downloadContentFromMessage(
          targetMessage.message[`${type}Message`], 
          type
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        mediaBuffer = buffer;
      }

      if (!mediaBuffer) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Failed to download media. Please try again." },
          { quoted: msg }
        );
      }

      // Parse optional metadata from args: packname|author
      const metaArg = args.find(a => a.includes("|"));
      const metadata = {
        pack: "HORLA POOKIE Bot",
        author: "HORLA POOKIE"
      };

      if (metaArg) {
        const [packname, author] = metaArg.split("|");
        metadata.pack = packname.trim() || "HORLA POOKIE Bot";
        metadata.author = author?.trim() || "HORLA POOKIE";
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: "🎨 Converting to sticker... Please wait!"
      }, { quoted: msg });

      try {
        let stickerBuffer;

        try {
          // Try wa-sticker-formatter first
          const sticker = new Sticker(mediaBuffer, {
            pack: metadata.pack,
            author: metadata.author,
            type: type === "video" ? StickerTypes.FULL : StickerTypes.DEFAULT,
            categories: ['🤖', '🎉'],
            id: Crypto.randomBytes(16).toString('hex'),
            quality: 50,
            background: 'transparent'
          });

          stickerBuffer = await sticker.toBuffer();
        } catch (stickerError) {
          console.log("wa-sticker-formatter failed, using fallback method");

          // Fallback to exif library
          try {
            if (type === "video") {
              const stickerPath = await writeExifVid(mediaBuffer, {
                packname: metadata.pack,
                author: metadata.author,
                categories: ['🤖', '🎉']
              });
              stickerBuffer = fs.readFileSync(stickerPath);
              fs.unlinkSync(stickerPath);
            } else {
              const stickerPath = await writeExifImg(mediaBuffer, {
                packname: metadata.pack,
                author: metadata.author,
                categories: ['🤖', '🎉']
              });
              stickerBuffer = fs.readFileSync(stickerPath);
              fs.unlinkSync(stickerPath);
            }
          } catch (exifError) {
            console.error("Both sticker methods failed:", exifError);
            throw exifError;
          }
        }

        await sock.sendMessage(msg.key.remoteJid, {
          sticker: stickerBuffer
        }, { quoted: msg });

      } catch (convertError) {
        console.error("Sticker conversion error:", convertError);

        // Send more specific error messages
        let errorMsg = "❌ Failed to convert to sticker. ";
        if (convertError.message?.includes('ffmpeg')) {
          errorMsg += "FFmpeg is not available. Please try again later.";
        } else if (type === "video") {
          errorMsg += "Make sure the video is under 10 seconds and in a supported format.";
        } else {
          errorMsg += "Make sure the image is in a supported format (JPG, PNG, WebP).";
        }

        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: errorMsg },
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error("Sticker command error:", error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Error processing sticker. Please try again with a valid image or video." },
        { quoted: msg }
      );
    }
  }
};