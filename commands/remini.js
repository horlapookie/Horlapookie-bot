import FormData from 'form-data';
import fetch from 'node-fetch';

async function remini(imageBuffer, operation) {
  return new Promise(async (resolve, reject) => {
    let operations = ['enhance', 'recolor', 'dehaze'];
    operations.includes(operation) ? operation = operation : operation = operations[0];

    let formData = new FormData();
    let apiUrl = 'https://inferenceengine.vyro.ai/' + operation;

    formData.append('model_version', 1, {
      'Content-Transfer-Encoding': 'binary',
      'contentType': 'multipart/form-data; charset=uttf-8'
    });

    formData.append('image', Buffer.from(imageBuffer), {
      'filename': 'enhance_image_body.jpg',
      'contentType': 'image/jpeg'
    });

    formData.submit({
      'url': apiUrl,
      'host': 'inferenceengine.vyro.ai',
      'path': '/' + operation,
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
  name: 'remini',
  aliases: ['enhance', 'upscale', 'hd'],
  description: 'Enhance, recolor, or dehaze images using AI',
  category: 'AI Image Generator',

  async execute(msg, { sock, args }) {
    const from = msg.key.remoteJid;
    const senderName = msg.pushName || 'User';

    // Check if message has image
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!msg.message?.imageMessage && !quotedMsg?.imageMessage) {
      return await sock.sendMessage(from, {
        text: `🎨 *Remini AI Image Enhancer*\n\nUsage: Send an image with caption ?remini [enhance/recolor/dehaze]\n\nOperations:\n• enhance - Improve image quality\n• recolor - Add colors to black & white images\n• dehaze - Remove haze/fog from images\n\nExample: Send image + ?remini enhance`
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: "🎨 *Processing image with AI...*"
      }, { quoted: msg });

      // Get operation type
      const operation = args[0] || 'enhance';
      const validOps = ['enhance', 'recolor', 'dehaze'];
      const selectedOp = validOps.includes(operation) ? operation : 'enhance';

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

      // Process with Remini
      const enhancedBuffer = await remini(buffer, selectedOp);

      // Send enhanced image
      await sock.sendMessage(from, {
        image: enhancedBuffer,
        caption: `🎨 *AI Enhanced Image*\n\n*Operation:* ${selectedOp.toUpperCase()}\n*Processed for:* ${senderName}\n\n*Powered by Remini AI*`
      }, { quoted: msg });

    } catch (error) {
      console.error('Remini enhancement error:', error);

      let errorMessage = '❌ Failed to enhance image. ';
      if (error.toString().includes('timeout')) {
        errorMessage += 'Request timed out, try again later.';
      } else if (error.toString().includes('network')) {
        errorMessage += 'Network error, please try again.';
      } else {
        errorMessage += 'Please try again with a different image.';
      }

      await sock.sendMessage(from, {
        text: errorMessage
      }, { quoted: msg });
    }
  }
};