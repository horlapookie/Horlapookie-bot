import FormData from 'form-data';
import fetch from 'node-fetch';

async function dehazeImage(imageBuffer) {
  return new Promise(async (resolve, reject) => {
    let formData = new FormData();
    let apiUrl = 'https://inferenceengine.vyro.ai/dehaze';

    formData.append('model_version', 1, {
      'Content-Transfer-Encoding': 'binary',
      'contentType': 'multipart/form-data; charset=uttf-8'
    });

    formData.append('image', Buffer.from(imageBuffer), {
      'filename': 'dehaze_image.jpg',
      'contentType': 'image/jpeg'
    });

    formData.submit({
      'url': apiUrl,
      'host': 'inferenceengine.vyro.ai',
      'path': '/dehaze',
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
  name: 'dehaze',
  aliases: ['defog', 'clearsky'],
  description: 'Remove haze and fog from images using AI',
  category: 'AI Image Generator',

  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const senderName = msg.pushName || 'User';

    // Check if message has image
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!msg.message?.imageMessage && !quotedMsg?.imageMessage) {
      return await sock.sendMessage(from, {
        text: `🌤️ *AI Image Dehazer*\n\nUsage: Send a hazy/foggy image with caption ?dehaze\n\nThis will remove haze, fog, and atmospheric distortion from your photos using AI technology.`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: "🌤️ *Removing haze with AI...*"
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

      // Dehaze with AI
      const dehazedBuffer = await dehazeImage(buffer);

      // Send dehazed image
      await sock.sendMessage(from, {
        image: dehazedBuffer,
        caption: `🌤️ *AI Dehazed Image*\n\n*Original:* Hazy/Foggy\n*Result:* Clear & Sharp\n*Processed for:* ${senderName}\n\n*Powered by AI Dehazing*`
      }, { quoted: msg });

    } catch (error) {
      console.error('Dehazing error:', error);

      await sock.sendMessage(from, {
        text: "❌ Failed to dehaze image. Please try again with a different image."
      }, { quoted: msg });
    }
  }
};