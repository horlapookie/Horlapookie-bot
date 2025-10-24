
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'brightness',
  description: 'Adjust image brightness',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to adjust brightness.\nUsage: ?brightness <value> (-1 to 1, default: 0.3)'
      }, { quoted: msg });
    }

    try {
      const brightness = parseFloat(args[0]) || 0.3;
      if (brightness < -1 || brightness > 1) {
        return await sock.sendMessage(from, {
          text: '⚠️ Brightness value must be between -1 and 1'
        }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: '🌟 Adjusting brightness...'
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
      const brightnessImage = await image.brightness(brightness);
      const processed = await brightnessImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: `🌟 Brightness adjusted to ${brightness}`
      }, { quoted: msg });

    } catch (error) {
      console.error('Brightness error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error adjusting brightness: ' + error.message
      }, { quoted: msg });
    }
  }
};
