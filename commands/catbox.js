
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import path from 'path';

export default {
  name: 'catbox',
  description: 'Upload image, video, or audio to catbox.moe and get a URL',
  aliases: ['upload', 'host'],
  async execute(msg, { sock, args, settings }) {
    const from = msg.key.remoteJid;

    // Check if replying to a message with media
    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      return await sock.sendMessage(from, {
        text: `❌ Please reply to an image, video, or audio message to upload to catbox.moe!\n\nUsage: Reply to media with ${settings.prefix}catbox`
      }, { quoted: msg });
    }

    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
    
    // Check if the quoted message contains supported media
    if (!quotedMsg.imageMessage && !quotedMsg.videoMessage && !quotedMsg.audioMessage && !quotedMsg.documentMessage) {
      return await sock.sendMessage(from, {
        text: '❌ Please reply to an image, video, audio, or document file!'
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        text: '📤 Uploading media to catbox.moe... Please wait!'
      }, { quoted: msg });

      // Get context info for download
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
      
      // Create message object for download
      const downloadMsg = {
        key: {
          remoteJid: from,
          id: contextInfo?.stanzaId || msg.key.id,
          participant: contextInfo?.participant
        },
        message: quotedMsg
      };

      // Download the media
      let buffer;
      let fileExtension = '';
      let mimeType = '';

      try {
        if (quotedMsg.imageMessage) {
          buffer = await sock.downloadMediaMessage(downloadMsg, 'buffer');
          mimeType = quotedMsg.imageMessage.mimetype || 'image/jpeg';
          fileExtension = mimeType.includes('png') ? '.png' : 
                         mimeType.includes('gif') ? '.gif' : 
                         mimeType.includes('webp') ? '.webp' : '.jpg';
        } else if (quotedMsg.videoMessage) {
          buffer = await sock.downloadMediaMessage(downloadMsg, 'buffer');
          mimeType = quotedMsg.videoMessage.mimetype || 'video/mp4';
          fileExtension = mimeType.includes('gif') ? '.gif' : 
                         mimeType.includes('webm') ? '.webm' : '.mp4';
        } else if (quotedMsg.audioMessage) {
          buffer = await sock.downloadMediaMessage(downloadMsg, 'buffer');
          mimeType = quotedMsg.audioMessage.mimetype || 'audio/mpeg';
          fileExtension = mimeType.includes('ogg') ? '.ogg' : 
                         mimeType.includes('wav') ? '.wav' : 
                         mimeType.includes('m4a') ? '.m4a' : '.mp3';
        } else if (quotedMsg.documentMessage) {
          buffer = await sock.downloadMediaMessage(downloadMsg, 'buffer');
          mimeType = quotedMsg.documentMessage.mimetype || 'application/octet-stream';
          fileExtension = path.extname(quotedMsg.documentMessage.fileName || '') || '.bin';
        }
      } catch (downloadError) {
        console.log('Download method 1 failed, trying alternative:', downloadError.message);
        
        // Alternative download method
        try {
          const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
          let mediaType = 'image';
          let mediaMessage = quotedMsg.imageMessage;
          
          if (quotedMsg.videoMessage) {
            mediaType = 'video';
            mediaMessage = quotedMsg.videoMessage;
            mimeType = quotedMsg.videoMessage.mimetype || 'video/mp4';
            fileExtension = '.mp4';
          } else if (quotedMsg.audioMessage) {
            mediaType = 'audio';
            mediaMessage = quotedMsg.audioMessage;
            mimeType = quotedMsg.audioMessage.mimetype || 'audio/mpeg';
            fileExtension = '.mp3';
          } else if (quotedMsg.documentMessage) {
            mediaType = 'document';
            mediaMessage = quotedMsg.documentMessage;
            mimeType = quotedMsg.documentMessage.mimetype || 'application/octet-stream';
            fileExtension = path.extname(quotedMsg.documentMessage.fileName || '') || '.bin';
          }
          
          const stream = await downloadContentFromMessage(mediaMessage, mediaType);
          let chunks = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
          
          if (!fileExtension && quotedMsg.imageMessage) {
            mimeType = quotedMsg.imageMessage.mimetype || 'image/jpeg';
            fileExtension = '.jpg';
          }
        } catch (altError) {
          console.log('Alternative download method also failed:', altError.message);
          throw new Error('Failed to download media');
        }
      }

      if (!buffer || buffer.length === 0) {
        return await sock.sendMessage(from, {
          text: '❌ Failed to download the media. Please try again.'
        }, { quoted: msg });
      }

      // Upload to catbox.moe
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', buffer, {
        filename: `file_${Date.now()}${fileExtension}`,
        contentType: mimeType
      });

      const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 60000 // 60 second timeout for large files
      });

      if (response.data && response.data.startsWith('https://files.catbox.moe/')) {
        const uploadUrl = response.data.trim();
        
        // Get file size info
        const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
        
        await sock.sendMessage(from, {
          text: `✅ *Media uploaded successfully to catbox.moe!*\n\n🔗 *URL:* ${uploadUrl}\n📁 *File Size:* ${fileSizeMB} MB\n📋 *Type:* ${mimeType}\n⏰ *Uploaded:* ${new Date().toLocaleString()}\n\n💡 *Tip:* This link will be available permanently. You can share it anywhere!`
        }, { quoted: msg });
      } else {
        throw new Error('Invalid response from catbox.moe');
      }

    } catch (error) {
      console.error('Catbox upload error:', error);
      await sock.sendMessage(from, {
        text: `❌ Failed to upload media to catbox.moe. This might be due to:\n• File size too large (max 200MB)\n• Network issues\n• Catbox.moe service unavailable\n• Unsupported file type\n\nError: ${error.message}\n\nPlease try again with a smaller file.`
      }, { quoted: msg });
    }
  }
};
