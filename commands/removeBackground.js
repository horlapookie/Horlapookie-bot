
import { Jimp } from 'jimp';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import axios from 'axios';

export default {
  name: 'removebg',
  aliases: ['rmbg', 'removeBackground'],
  description: 'Remove background from image',
  category: 'Image-Effects',
  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    
    // Check if replying to an image message
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !msg.message?.imageMessage) {
      return await sock.sendMessage(from, {
        text: 'Please reply to an image or send an image to remove background.'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '🎭 Removing background...'
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
      
      // Try multiple background removal APIs
      const apis = [
        {
          name: 'Remove.bg API',
          url: 'https://api.remove.bg/v1.0/removebg',
          process: async (imageBuffer) => {
            const response = await axios.post('https://api.remove.bg/v1.0/removebg', {
              image_file_b64: imageBuffer.toString('base64'),
              size: 'auto'
            }, {
              headers: {
                'X-Api-Key': 'YOUR_REMOVEBG_API_KEY', // Users would need to add their own key
                'Content-Type': 'application/json'
              },
              responseType: 'arraybuffer'
            });
            return Buffer.from(response.data);
          }
        },
        {
          name: 'Simple Edge Detection',
          process: async (imageBuffer) => {
            // Fallback: Simple edge detection and background removal using Jimp
            const image = await Jimp.read(imageBuffer);
            
            // Convert to grayscale for edge detection
            const edges = image.clone().greyscale().normalize();
            
            // Apply a simple threshold to create a mask
            edges.scan(0, 0, edges.bitmap.width, edges.bitmap.height, function (x, y, idx) {
              const red = this.bitmap.data[idx];
              const threshold = 128;
              
              if (red < threshold) {
                // Make background transparent
                this.bitmap.data[idx + 3] = 0; // Alpha channel
              }
            });
            
            return await edges.getBuffer('image/png');
          }
        }
      ];

      let success = false;
      for (const api of apis) {
        try {
          const processedImage = await api.process(media);
          
          await sock.sendMessage(from, {
            image: processedImage,
            caption: '🎭 Background removed!'
          }, { quoted: msg });
          
          success = true;
          break;
        } catch (apiError) {
          console.log(`Background removal API ${api.name} failed:`, apiError.message);
          continue;
        }
      }

      if (!success) {
        // Final fallback - simple transparency effect
        const image = await Jimp.read(media);
        
        // Apply a simple background removal technique
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
          const red = this.bitmap.data[idx];
          const green = this.bitmap.data[idx + 1];
          const blue = this.bitmap.data[idx + 2];
          
          // Remove white/light backgrounds
          if (red > 200 && green > 200 && blue > 200) {
            this.bitmap.data[idx + 3] = 0; // Make transparent
          }
        });
        
        const processed = await image.getBuffer('image/png');
        
        await sock.sendMessage(from, {
          image: processed,
          caption: '🎭 Background removed (basic method)!'
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Background removal error:', error);
      await sock.sendMessage(from, {
        text: '❌ Error removing background: ' + error.message
      }, { quoted: msg });
    }
  }
};
