
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'resize',
  description: 'Resize image to specified dimensions',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to resize.\nUsage: ?resize <width> <height>\nExample: ?resize 500 500'
      }, { quoted: msg });
    }

    try {
      const width = parseInt(args[0]) || 512;
      const height = parseInt(args[1]) || width;

      if (width > 2048 || height > 2048) {
        return await sock.sendMessage(from, {
          text: '⚠️ Maximum size is 2048x2048 pixels'
        }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: `📏 Resizing image to ${width}x${height}...`
      }, { quoted: msg });

      let targetMessage = quotedMessage ? {
        key: {
          remoteJid: from,
          id: contextInfo.stanzaId,
          participant: contextInfo.participant
        },
        message: quotedMessage
      } : msg;

      // Download image
      const media = await downloadMediaMessage(targetMessage, 'buffer', {});
      
      // Process with Jimp
      const image = await Jimp.read(media);
      const resizedImage = await image.resize({ w: width, h: height });
      const processed = await resizedImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: `📏 Image resized to ${width}x${height}!`
      }, { quoted: msg });

    } catch (error) {
      console.error('Resize error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error resizing image: ' + error.message
      }, { quoted: msg });
    }
  }
};
