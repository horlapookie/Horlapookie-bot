
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'rotate',
  description: 'Rotate image by specified degrees',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to rotate.\nUsage: ?rotate <degrees> (default: 90)'
      }, { quoted: msg });
    }

    try {
      const degrees = parseInt(args[0]) || 90;

      await sock.sendMessage(from, {
        text: `🔄 Rotating image by ${degrees} degrees...`
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
      const rotatedImage = await image.rotate(degrees);
      const processed = await rotatedImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: `🔄 Image rotated by ${degrees} degrees!`
      }, { quoted: msg });

    } catch (error) {
      console.error('Rotate error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error rotating image: ' + error.message
      }, { quoted: msg });
    }
  }
};
