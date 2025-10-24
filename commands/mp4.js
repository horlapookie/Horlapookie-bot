
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export default {
  name: 'mp4',
  description: '🎬 Convert a replied video sticker to MP4 video.',
  aliases: ['tovideo', 'stickertomp4'],
  async execute(msg, { sock }) {
    console.log(`[INFO] Executing mp4 command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);
    
    try {
      // Check if replying to a message
      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: 'Please reply to a video sticker!\n\n📝 This command converts animated/video stickers to MP4 format.',
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363269950668068@newsletter',
              newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
              serverMessageId: -1
            }
          }
        }, { quoted: msg });
        return;
      }

      const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
      const stickerMessage = quotedMessage.stickerMessage;

      if (!stickerMessage) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ Please reply to a sticker message.',
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363269950668068@newsletter',
              newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
              serverMessageId: -1
            }
          }
        }, { quoted: msg });
        return;
      }

      // Check if it's an animated sticker (video)
      const isAnimated = stickerMessage.isAnimated || stickerMessage.seconds > 0;

      if (!isAnimated) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ This appears to be a static sticker. Please use a video/animated sticker.\n\n💡 Use `?simage` for static stickers.',
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363269950668068@newsletter',
              newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
              serverMessageId: -1
            }
          }
        }, { quoted: msg });
        return;
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: "🎬 Converting video sticker to MP4... Please wait!",
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363269950668068@newsletter',
            newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
            serverMessageId: -1
          }
        }
      }, { quoted: msg });

      // Build target message for download
      const targetMessage = {
        key: {
          remoteJid: msg.key.remoteJid,
          id: msg.message.extendedTextMessage.contextInfo.stanzaId,
          participant: msg.message.extendedTextMessage.contextInfo.participant
        },
        message: quotedMessage
      };

      const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
        logger: undefined, 
        reuploadRequest: sock.updateMediaMessage 
      });

      if (!mediaBuffer) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: 'Failed to download sticker. Please try again.',
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363269950668068@newsletter',
              newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
              serverMessageId: -1
            }
          }
        });
        return;
      }

      console.log(`[INFO] Converting animated sticker to MP4`);

      // Create temp directory if it doesn't exist
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const inputPath = path.join(tmpDir, `sticker_${Date.now()}.webp`);
      const outputPath = path.join(tmpDir, `video_${Date.now()}.mp4`);

      try {
        // Write sticker to temp file
        fs.writeFileSync(inputPath, mediaBuffer);

        // Convert using ffmpeg with better quality settings
        await new Promise((resolve, reject) => {
          const ffmpegCmd = `ffmpeg -i "${inputPath}" -movflags +faststart -pix_fmt yuv420p -vf "scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos" -c:v libx264 -crf 28 -preset fast "${outputPath}"`;
          
          exec(ffmpegCmd, (error, stdout, stderr) => {
            if (error) {
              console.error('FFmpeg error:', error);
              console.error('FFmpeg stderr:', stderr);
              reject(error);
            } else {
              console.log('FFmpeg conversion successful');
              resolve();
            }
          });
        });

        const videoBuffer = fs.readFileSync(outputPath);

        console.log(`[INFO] Sending MP4 video to ${msg.key.remoteJid}`);
        await sock.sendMessage(msg.key.remoteJid, {
          video: videoBuffer,
          caption: '🎬 Here\'s your MP4 video!\n\n✨ Converted from sticker',
          gifPlayback: false,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363269950668068@newsletter',
              newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
              serverMessageId: -1
            }
          }
        }, { quoted: msg });

        // Clean up temp files
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

      } catch (conversionError) {
        console.error('Video conversion failed:', conversionError);
        
        // Clean up temp files even on error
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }

        throw new Error('Failed to convert video sticker. The sticker might be corrupted or in an unsupported format.');
      }

      console.log(`[INFO] mp4 command executed successfully`);
    } catch (error) {
      console.error(`[ERROR] Failed to execute mp4 command:`, error.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ Failed to convert sticker: ${error.message}\n\n💡 Make sure you're replying to an animated/video sticker.`,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363269950668068@newsletter',
            newsletterName: '❦ ════ •⊰❂ AI TOOLS HUB  ❂⊱• ════ ❦',
            serverMessageId: -1
          }
        }
      }, { quoted: msg }).catch((err) => {
        console.error('[ERROR] Failed to send error message:', err.message);
      });
    }
  }
};
