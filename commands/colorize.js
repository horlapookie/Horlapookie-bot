import FormData from 'form-data';
import fetch from 'node-fetch';

async function colorizeImage(imageBuffer) {
  return new Promise(async (resolve, reject) => {
    let formData = new FormData();
    let apiUrl = 'https://inferenceengine.vyro.ai/recolor';

    formData.append('model_version', 1, {
      'Content-Transfer-Encoding': 'binary',
      'contentType': 'multipart/form-data; charset=uttf-8'
    });

    formData.append('image', Buffer.from(imageBuffer), {
      'filename': 'colorize_image.jpg',
      'contentType': 'image/jpeg'
    });

    formData.submit({
      'url': apiUrl,
      'host': 'inferenceengine.vyro.ai',
      'path': '/recolor',
      'protocol': 'https:',
      'headers': {
        'User-Agent': 'okhttp/4.9.3',
        'Connection': 'Keep-Alive',
        'Accept-Encoding': 'gzip'
      }
    }, function (error, response) {
      if (error) reject(error);

      let chunks = [];
      response.on('data', function (chunk) {
        chunks.push(chunk);
      }).on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      response.on('error', errorMsg => {
        reject(errorMsg);
      });
    });
  });
}

export default {
  name: 'colorize',
  aliases: ['recolor', 'color'],
  description: 'Add colors to black and white images using AI',
  category: 'AI Image Generator',

  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const senderName = msg.pushName || 'User';

    // Check if message has image
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!msg.message?.imageMessage && !quotedMsg?.imageMessage) {
      return await sock.sendMessage(from, {
        text: `🎨 *AI Image Colorizer*\n\nUsage: Send a black & white image with caption ?colorize\n\nThis will add realistic colors to your black and white photos using AI technology.`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: "🎨 *Colorizing image with AI...*"
      }, { quoted: msg });

      // Download the image
      let buffer;
      if (msg.message?.imageMessage) {
        buffer = await sock.downloadMediaMessage(msg, 'buffer');
      } else if (quotedMsg?.imageMessage) {
        const imageMsg = {
          key: {
            remoteJid: from,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant || undefined
          },
          message: quotedMsg
        };
        buffer = await sock.downloadMediaMessage(imageMsg, 'buffer');
      }

      if (!buffer) {
        return await sock.sendMessage(from, {
          text: "❌ Failed to download image. Please try again."
        }, { quoted: msg });
      }

      // Colorize with AI
      const colorizedBuffer = await colorizeImage(buffer);

      // Send colorized image
      await sock.sendMessage(from, {
        image: colorizedBuffer,
        caption: `🎨 *AI Colorized Image*\n\n*Original:* Black & White\n*Result:* Full Color\n*Processed for:* ${senderName}\n\n*Powered by AI Colorization*`
      }, { quoted: msg });

    } catch (error) {
      console.error('Colorization error:', error);

      await sock.sendMessage(from, {
        text: "❌ Failed to colorize image. Please try again with a different image."
      }, { quoted: msg });
    }
  }
};