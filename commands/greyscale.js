
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'greyscale',
  aliases: ['grayscale', 'bw'],
  description: 'Convert image to greyscale',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to convert to greyscale.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🎨 Converting to greyscale...'
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
      const greyscaleImage = await image.greyscale();
      const processed = await greyscaleImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: '⚫ Greyscale effect applied!'
      }, { quoted: msg });

    } catch (error) {
      console.error('Greyscale effect error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error applying greyscale effect: ' + error.message
      }, { quoted: msg });
    }
  }
};
