
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker } from 'wa-sticker-formatter';
import fs from 'fs';
import { exec } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';

export default {
  name: 'simage',
  description: '🖼️ Convert a replied sticker to PNG image or video sticker to MP4.',
  async execute(msg, { sock }) {
    console.log(`[INFO] Executing simage command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);
    
    try {
      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
        console.log('[INFO] No sticker message found in reply');
        await sock.sendMessage(msg.key.remoteJid, { text: 'Please reply to a sticker!' }, { quoted: msg });
        return;
      }

      const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
      const stickerMessage = quotedMessage.stickerMessage;

      // Check if it's an animated sticker (video)
      const isAnimated = stickerMessage.isAnimated || stickerMessage.seconds > 0;

      const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      console.log(`[INFO] Converting sticker (animated: ${isAnimated})`);

      if (isAnimated) {
        // Use ffmpeg for animated stickers
        const tempDir = tmpdir();
        const inputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const outputPath = path.join(tempDir, `video_${Date.now()}.mp4`);

        try {
          // Write sticker to temp file
          fs.writeFileSync(inputPath, buffer);

          // Convert using ffmpeg
          await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${inputPath}" -movflags +faststart -pix_fmt yuv420p -vf "scale=512:512:force_original_aspect_ratio=decrease" "${outputPath}"`, (error, stdout, stderr) => {
              if (error) {
                console.error('FFmpeg error:', error);
                reject(error);
              } else {
                resolve();
              }
            });
          });

          const videoBuffer = fs.readFileSync(outputPath);

          console.log(`[INFO] Sending MP4 video to ${msg.key.remoteJid}`);
          await sock.sendMessage(msg.key.remoteJid, {
            video: videoBuffer,
            caption: '🎬 Here\'s your video!',
            gifPlayback: false
          }, { quoted: msg });

          // Clean up temp files
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

        } catch (ffmpegError) {
          console.error('FFmpeg conversion failed:', ffmpegError);
          
          // Fallback: try with wa-sticker-formatter
          try {
            const sticker = new Sticker(buffer);
            const videoBuffer = await sticker.toBuffer();
            
            await sock.sendMessage(msg.key.remoteJid, {
              video: videoBuffer,
              caption: '🎬 Here\'s your video!',
              gifPlayback: true
            }, { quoted: msg });
          } catch (fallbackError) {
            throw new Error('Both FFmpeg and wa-sticker-formatter failed to convert animated sticker');
          }
        }
      } else {
        // Use ffmpeg for static stickers to PNG
        const tempDir = tmpdir();
        const inputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const outputPath = path.join(tempDir, `image_${Date.now()}.png`);

        try {
          // Write sticker to temp file
          fs.writeFileSync(inputPath, buffer);

          // Convert using ffmpeg
          await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
              if (error) {
                console.error('FFmpeg error:', error);
                reject(error);
              } else {
                resolve();
              }
            });
          });

          const imageBuffer = fs.readFileSync(outputPath);

          console.log(`[INFO] Sending PNG image to ${msg.key.remoteJid}`);
          await sock.sendMessage(msg.key.remoteJid, {
            image: imageBuffer,
            caption: '✨ Here\'s your image!'
          }, { quoted: msg });

          // Clean up temp files
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

        } catch (ffmpegError) {
          console.error('FFmpeg conversion failed:', ffmpegError);
          throw new Error('Failed to convert static sticker to image');
        }
      }

      console.log(`[INFO] simage command executed successfully`);
    } catch (error) {
      console.error(`[ERROR] Failed to execute simage command:`, error.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Failed to convert sticker: ${error.message}`,
      }, { quoted: msg }).catch((err) => {
        console.error('[ERROR] Failed to send error message:', err.message);
      });
    }
  }
};
