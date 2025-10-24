
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'contrast',
  description: 'Adjust image contrast',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to adjust contrast.\nUsage: ?contrast <value> (-1 to 1, default: 0.3)'
      }, { quoted: msg });
    }

    try {
      const contrast = parseFloat(args[0]) || 0.3;
      if (contrast < -1 || contrast > 1) {
        return await sock.sendMessage(from, {
          text: '⚠️ Contrast value must be between -1 and 1'
        }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: '🎭 Adjusting contrast...'
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
      const contrastImage = await image.contrast(contrast);
      const processed = await contrastImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: `🎭 Contrast adjusted to ${contrast}`
      }, { quoted: msg });

    } catch (error) {
      console.error('Contrast error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error adjusting contrast: ' + error.message
      }, { quoted: msg });
    }
  }
};
