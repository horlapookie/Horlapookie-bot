import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { exec } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default {
  name: 'simage',
  description: '🖼️ Convert a replied sticker to a PNG image.',
  async execute(msg, { sock }) {
    console.log(`[INFO] Executing simage command for message ID: ${msg.key.id}, from: ${msg.key.remoteJid}`);
    try {
      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
        console.log('[INFO] No sticker message found in reply');
        await sock.sendMessage(msg.key.remoteJid, { text: 'Please reply to a sticker!' }, { quoted: msg });
        return;
      }

      const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
      const stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const tempDir = './temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      const tempSticker = `${tempDir}/temp_${Date.now()}.webp`;
      const tempOutput = `${tempDir}/image_${Date.now()}.png`;

      console.log(`[INFO] Writing sticker to ${tempSticker}`);
      fs.writeFileSync(tempSticker, buffer);

      console.log(`[INFO] Converting sticker to PNG using ffmpeg`);
      try {
        await execPromise(`ffmpeg -i ${tempSticker} ${tempOutput}`);
      } catch (ffmpegError) {
        console.error(`[ERROR] FFmpeg failed:`, ffmpegError.message);
        throw new Error('FFmpeg is not installed or not found. Please install it using `pkg install ffmpeg` in Termux.');
      }

      console.log(`[INFO] Sending PNG image to ${msg.key.remoteJid}`);
      await sock.sendMessage(msg.key.remoteJid, {
        image: fs.readFileSync(tempOutput),
        caption: '✨ Here\'s your image!'
      }, { quoted: msg });

      console.log(`[INFO] Cleaning up temporary files`);
      fs.unlinkSync(tempSticker);
      fs.unlinkSync(tempOutput);

      console.log(`[INFO] simage command executed successfully`);
    } catch (error) {
      console.error(`[ERROR] Failed to execute simage command:`, error.message);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `Failed to convert sticker to image: ${error.message}`,
      }, { quoted: msg }).catch((err) => {
        console.error('[ERROR] Failed to send error message:', err.message);
      });
    }
  }
};
