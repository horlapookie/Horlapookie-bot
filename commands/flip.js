
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  name: 'flip',
  description: 'Flip image horizontally or vertically',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to flip.\nUsage: ?flip <direction>\nDirections: horizontal, vertical, h, v'
      }, { quoted: msg });
    }

    try {
      const direction = args[0]?.toLowerCase() || 'horizontal';
      const isVertical = direction === 'vertical' || direction === 'v';
      const isHorizontal = direction === 'horizontal' || direction === 'h';

      if (!isVertical && !isHorizontal) {
        return await sock.sendMessage(from, {
          text: '⚠️ Invalid direction. Use: horizontal, vertical, h, or v'
        }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: `🔄 Flipping image ${isVertical ? 'vertically' : 'horizontally'}...`
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
      const flippedImage = await image.flip({ horizontal: isHorizontal, vertical: isVertical });
      const processed = await flippedImage.getBuffer('image/jpeg');

      await sock.sendMessage(from, {
        image: processed,
        caption: `🔄 Image flipped ${isVertical ? 'vertically' : 'horizontally'}!`
      }, { quoted: msg });

    } catch (error) {
      console.error('Flip error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error flipping image: ' + error.message
      }, { quoted: msg });
    }
  }
};
