
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'sepia',
  description: 'Apply sepia effect to image',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to apply sepia effect.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🎨 Applying sepia effect...'
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
      const sepiaImage = await image.sepia();
      const processed = await sepiaImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: '🟤 Sepia effect applied!'
      }, { quoted: msg });

    } catch (error) {
      console.error('Sepia effect error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error applying sepia effect: ' + error.message
      }, { quoted: msg });
    }
  }
};
