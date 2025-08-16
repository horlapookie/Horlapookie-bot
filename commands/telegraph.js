
import axios from 'axios';
import FormData from 'form-data';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const TelegraPH = async (buffer, filename = 'file') => {
  return new Promise(async (resolve, reject) => {
    try {
      const form = new FormData();
      form.append('file', buffer, {
        filename: filename,
        contentType: 'application/octet-stream'
      });

      const response = await axios.post('https://telegra.ph/upload', form, {
        headers: {
          ...form.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      });

      if (response.data && response.data[0] && response.data[0].src) {
        return resolve('https://telegra.ph' + response.data[0].src);
      } else {
        return reject(new Error('Invalid response from Telegraph'));
      }
    } catch (error) {
      return reject(new Error(`Telegraph upload failed: ${error.message}`));
    }
  });
};

export default {
  name: 'telegraph',
  aliases: ['tg'],
  description: '📤 Upload images/media to Telegraph and get a permanent link',
  async execute(msg, { sock }) {
    try {
      let targetMessage = null;
      let mediaType = null;

      // Check if replying to a message
      if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        
        if (quotedMsg.imageMessage) {
          targetMessage = {
            key: {
              remoteJid: msg.key.remoteJid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextMessage.contextInfo.participant
            },
            message: quotedMsg
          };
          mediaType = 'image';
        } else if (quotedMsg.videoMessage) {
          targetMessage = {
            key: {
              remoteJid: msg.key.remoteJid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextMessage.contextInfo.participant
            },
            message: quotedMsg
          };
          mediaType = 'video';
        } else if (quotedMsg.documentMessage) {
          targetMessage = {
            key: {
              remoteJid: msg.key.remoteJid,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextMessage.contextInfo.participant
            },
            message: quotedMsg
          };
          mediaType = 'document';
        }
      }
      // Check current message
      else if (msg.message?.imageMessage) {
        targetMessage = msg;
        mediaType = 'image';
      } else if (msg.message?.videoMessage) {
        targetMessage = msg;
        mediaType = 'video';
      } else if (msg.message?.documentMessage) {
        targetMessage = msg;
        mediaType = 'document';
      }

      if (!targetMessage) {
        return await sock.sendMessage(
          msg.key.remoteJid,
          { text: "❌ Please reply to an image, video, or document to upload to Telegraph!\n\n📝 **Usage:**\n• Reply to media: ?telegraph" },
          { quoted: msg }
        );
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: "📤 Uploading to Telegraph... Please wait!"
      }, { quoted: msg });

      try {
        // Download the media
        const stream = await downloadContentFromMessage(targetMessage.message[`${mediaType}Message`], mediaType);
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        if (buffer.length === 0) {
          throw new Error('Downloaded file is empty');
        }

        // Check file size (Telegraph has limits)
        if (buffer.length > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('File too large for Telegraph (max 5MB)');
        }

        // Get filename
        const messageObj = targetMessage.message[`${mediaType}Message`];
        let filename = messageObj.caption || `file_${Date.now()}`;
        
        if (mediaType === 'image') {
          filename += '.jpg';
        } else if (mediaType === 'video') {
          filename += '.mp4';
        } else if (mediaType === 'document') {
          filename = messageObj.fileName || filename;
        }

        // Upload to Telegraph
        const telegraphUrl = await TelegraPH(buffer, filename);

        await sock.sendMessage(msg.key.remoteJid, {
          text: `✅ **Successfully uploaded to Telegraph!**\n\n🔗 **Link:** ${telegraphUrl}\n\n📄 **File Type:** ${mediaType}\n📏 **Size:** ${(buffer.length / 1024).toFixed(2)} KB\n📝 **Filename:** ${filename}`
        }, { quoted: msg });

      } catch (uploadError) {
        console.error('Telegraph upload error:', uploadError.message);
        
        let errorMsg = "❌ Failed to upload to Telegraph. ";
        if (uploadError.message.includes('empty')) {
          errorMsg += "The file appears to be empty or corrupted.";
        } else if (uploadError.message.includes('too large')) {
          errorMsg += "File is too large (max 5MB for Telegraph).";
        } else if (uploadError.message.includes('timeout')) {
          errorMsg += "Upload timed out. Please try again.";
        } else {
          errorMsg += "Please try again later.";
        }
        
        await sock.sendMessage(
          msg.key.remoteJid,
          { text: errorMsg },
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error("Telegraph command error:", error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Error processing Telegraph upload. Please try again with a valid media file." },
        { quoted: msg }
      );
    }
  }
};
