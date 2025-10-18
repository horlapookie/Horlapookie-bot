
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'invert',
  aliases: ['negative'],
  description: 'Invert image colors (negative effect)',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to invert colors.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🔄 Inverting image colors...'
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
      const invertedImage = await image.invert();
      const processed = await invertedImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: '🔄 Image colors inverted!'
      }, { quoted: msg });

    } catch (error) {
      console.error('Invert error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error inverting image: ' + error.message
      }, { quoted: msg });
    }
  }
};
